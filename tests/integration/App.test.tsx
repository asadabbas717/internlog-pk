import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { App } from '../../src/app/App';
import {
  openLogDatabase,
  StorageError,
} from '../../src/infrastructure/storage/database';
import type { LogDatabase } from '../../src/infrastructure/storage/database';
import type { InternshipData } from '../../src/domain/model';
import { makeData, makeEntry } from '../fixtures/data';

const handles: LogDatabase[] = [];
afterEach(() => {
  for (const db of handles.splice(0)) db.close();
  vi.restoreAllMocks();
});

async function boot(data?: InternshipData) {
  const factory = new IDBFactory();
  const open = async () => {
    const db = await openLogDatabase({ factory, name: 'ui-test' });
    handles.push(db);
    return db;
  };
  if (data) {
    const db = await open();
    await db.save(data, 0);
    db.close();
  }
  const view = render(
    <StrictMode>
      <App openDatabase={open} />
    </StrictMode>,
  );
  await screen.findByRole(
    'heading',
    { name: 'Your work log' },
    { timeout: 5000 },
  );
  return { ...view, open };
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
}
function fieldValue(label: string): string {
  const field = screen.getByLabelText(label);
  if (!(
    field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
  ))
    throw new Error('Expected an editable field');
  return field.value;
}
function fillProfile() {
  change('Student name', 'Sample Student');
  change('University or institution', 'Example University');
  change('Degree or program', 'BS Computer Science');
  change('Host organization', 'Example Software');
  change('Internship start date', '2026-01-01');
  change('Internship end date', '2026-12-31');
}
function fillEntry(description = 'Built a sample accessible form') {
  change('Work date', '2026-10-19');
  change('Work performed', description);
  change('Hours worked', '1');
  change('Minutes worked', '30');
  change('Skills or learning outcomes', 'Accessible form validation');
}
async function saved(message: string) {
  await screen.findByText(message);
}

describe('student workflows with actual storage coordination', () => {
  it('exposes landmarks, offline/privacy boundaries and usable empty profile form', async () => {
    await boot();
    expect(screen.getByRole('main').id).toBe('main');
    expect(
      screen
        .getByRole('link', { name: 'Skip to content' })
        .getAttribute('href'),
    ).toBe('#main');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Your internship, clearly recorded.',
    );
    expect(
      screen.getByRole('heading', { name: 'Set up your internship' }),
    ).toBeTruthy();
    expect(screen.getByText(/Profile incomplete/)).toBeTruthy();
    expect(
      screen.getByText(/Not an official HEC or university application/),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Local does not mean permanent.' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('status', { name: 'Offline availability' }).textContent,
    ).toContain('Development mode');
    expect(
      screen
        .getByRole('button', { name: /Add entry/ })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
  it('rejects invalid submissions with field focus and does not persist them', async () => {
    const app = await boot();
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => {
      expect(document.activeElement?.id).toBe('profile-startDate');
    });
    fillProfile();
    change('Required hours', '0');
    change('Additional required minutes', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => {
      expect(document.activeElement?.id).toBe('profile-requiredHours');
    });
    expect((await (await app.open()).load()).data.profile).toBeNull();
  });
  it('creates and edits a profile, preserving it on reload', async () => {
    const app = await boot();
    fillProfile();
    change('Required hours', '200');
    change('Additional required minutes', '15');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await saved('Profile saved on this browser.');
    expect(
      (await (await app.open()).load()).data.profile?.requiredMinutes,
    ).toBe(12015);
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    change('Host organization', 'Updated Example');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await saved('Profile saved on this browser.');
    app.unmount();
    render(<App openDatabase={app.open} />);
    await screen.findByText('Updated Example');
    expect(
      screen.queryByRole('form', { name: 'Set up your internship' }),
    ).toBeNull();
  });
  it('creates, edits and confirms removal of an authentic entry; dashboard follows persisted records', async () => {
    const app = await boot(makeData([]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await saved('Entry saved on this browser.');
    expect(
      screen.getByRole('article', { name: 'Work entry on 2026-10-19' })
        .textContent,
    ).toContain('1h 30m');
    expect(screen.getByText('1% of your target recorded')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit entry' }));
    change('Hours worked', '2');
    change('Minutes worked', '1');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await saved('Entry saved on this browser.');
    expect(
      (await (await app.open()).load()).data.entries[0]?.durationMinutes,
    ).toBe(121);
    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
    expect(
      screen.getByRole('dialog', { name: 'Delete this work entry?' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }));
    expect(screen.getByRole('button', { name: 'Edit entry' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
    await saved('Entry deleted from this browser.');
    expect((await (await app.open()).load()).data.entries).toEqual([]);
    expect(screen.getByText('0% of your target recorded')).toBeTruthy();
  });
  it('rejects bad links, invalid durations and aggregate daily overbooking while keeping draft text', async () => {
    const app = await boot(makeData([makeEntry(1, { durationMinutes: 1440 })]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    change('Minutes worked', '60');
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await waitFor(() => {
      expect(document.activeElement?.id).toBe('entry-minutes');
    });
    change('Minutes worked', '0');
    change('Evidence link · optional', 'javascript:alert(1)');
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await waitFor(() => {
      expect(document.activeElement?.id).toBe('entry-referenceUrl');
    });
    change('Evidence link · optional', '');
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('24 hours');
    });
    expect(
      screen.getByLabelText('Work performed').getAttribute('aria-invalid'),
    ).toBe('false');
    expect(fieldValue('Work performed')).toBe('Built a sample accessible form');
    expect((await (await app.open()).load()).data.entries).toHaveLength(1);
  });
  it('warns about similar work while allowing a distinct entry', async () => {
    await boot(
      makeData([
        makeEntry(1, { description: 'Built a sample accessible form' }),
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await screen.findByText(/An entry on this date has the same description/);
    fireEvent.click(
      screen.getByRole('button', { name: 'Save distinct entry' }),
    );
    await saved('Entry saved on this browser.');
    expect(
      screen.getAllByRole('article', { name: 'Work entry on 2026-10-19' }),
    ).toHaveLength(2);
  });
  it('rejects profile dates excluding existing work', async () => {
    await boot(makeData());
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    change('Internship end date', '2026-10-01');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain('date range');
    expect(
      screen.getByText('Implemented and tested a sample form.'),
    ).toBeTruthy();
  });
  it('confirms abandoning unsaved forms and keeps them if cancelled', async () => {
    await boot(makeData([]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getByRole('heading', { name: 'Add a work entry' }),
    ).toBeTruthy();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('heading', { name: 'Add a work entry' }),
    ).toBeNull();
  });
  it('preserves drafts on quota failures without showing fake success', async () => {
    const app = await boot(makeData([]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    const spy = vi
      .spyOn(IDBObjectStore.prototype, 'put')
      .mockImplementation(() => {
        throw new DOMException('No space', 'QuotaExceededError');
      });
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await screen.findByText(/Browser storage is full/);
    expect(screen.queryByText('Entry saved on this browser.')).toBeNull();
    expect(fieldValue('Work performed')).toBe('Built a sample accessible form');
    spy.mockRestore();
    expect((await (await app.open()).load()).data.entries).toEqual([]);
  });
  it('keeps drafts on a stale write, refreshes explicitly, then reapplies to latest records', async () => {
    const app = await boot(makeData([]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry('Draft retained across refresh');
    const other = await app.open();
    const original = await other.load();
    await other.save(
      makeData([makeEntry(2, { date: '2026-10-20' })]),
      original.revision,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await screen.findByText(/Records changed in another tab/);
    expect(
      screen
        .getByRole('button', { name: 'Save entry' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(
      screen.getByRole('button', { name: 'Load latest records (keep draft)' }),
    );
    await screen.findByText(/Latest records loaded/);
    expect(fieldValue('Work performed')).toBe('Draft retained across refresh');
    expect(
      screen.getByRole('article', { name: 'Work entry on 2026-10-20' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await saved('Entry saved on this browser.');
    expect((await other.load()).data.entries).toHaveLength(2);
  });
  it('shows denied/corrupt startup errors and supports safe retry without inventing empty records', async () => {
    const open = vi
      .fn<() => Promise<LogDatabase>>()
      .mockRejectedValue(
        new StorageError(
          'corrupt',
          'Stored records are invalid. No records were changed.',
        ),
      );
    render(<App openDatabase={open} />);
    await screen.findByText(
      'Stored records are invalid. No records were changed.',
    );
    expect(
      screen.queryByRole('heading', { name: 'Set up your internship' }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry local storage' }),
    );
    await waitFor(() => {
      expect(open).toHaveBeenCalledTimes(2);
    });
  });
  it('does not resurrect an entry deleted by another tab after a retained-draft refresh', async () => {
    const app = await boot(makeData());
    fireEvent.click(screen.getByRole('button', { name: 'Edit entry' }));
    change('Work performed', 'Retained edit of deleted work');
    const other = await app.open();
    const latest = await other.load();
    await other.save({ ...latest.data, entries: [] }, latest.revision);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText(/Records changed in another tab/);
    fireEvent.click(
      screen.getByRole('button', { name: 'Load latest records (keep draft)' }),
    );
    await screen.findByText(/Latest records loaded/);
    expect(fieldValue('Work performed')).toBe('Retained edit of deleted work');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText(/This entry no longer exists/);
    expect((await other.load()).data.entries).toEqual([]);
    expect(fieldValue('Work performed')).toBe('Retained edit of deleted work');
  });
  it('retains initial profile setup text when refresh discovers another tab already created the profile', async () => {
    const app = await boot();
    fillProfile();
    change('Host organization', 'Draft organization');
    const other = await app.open();
    await other.save(makeData([]), 0);
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await screen.findByText(/Records changed in another tab/);
    fireEvent.click(
      screen.getByRole('button', { name: 'Load latest records (keep draft)' }),
    );
    await screen.findByText(/Latest records loaded/);
    expect(fieldValue('Host organization')).toBe('Draft organization');
    expect(screen.getByText('Example Software', { exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await saved('Profile saved on this browser.');
    expect((await other.load()).data.profile?.organization).toBe(
      'Draft organization',
    );
  });
  it('reopens closed storage explicitly without losing an entry draft', async () => {
    await boot(makeData([]));
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    const active = handles.at(-1);
    if (!active) throw new Error('Expected active storage handle');
    active.close();
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await screen.findByText(/Storage connection closed/);
    expect(fieldValue('Work performed')).toBe('Built a sample accessible form');
    fireEvent.click(
      screen.getByRole('button', { name: 'Load latest records (keep draft)' }),
    );
    await screen.findByText(/Latest records loaded/);
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await saved('Entry saved on this browser.');
  });
  it('does not show success or permit competing actions while a save is pending', async () => {
    const factory = new IDBFactory();
    const db = await openLogDatabase({ factory });
    handles.push(db);
    await db.save(makeData([]), 0);
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const open = (): Promise<LogDatabase> =>
      Promise.resolve({
        load: () => db.load(),
        close: () => undefined,
        save: async (data, revision) => {
          await gate;
          return db.save(data, revision);
        },
      });
    render(<App openDatabase={open} />);
    await screen.findByRole('heading', { name: 'Your work log' });
    fireEvent.click(screen.getByRole('button', { name: /Add entry/ }));
    fillEntry();
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    await screen.findByRole('button', { name: 'Please wait…' });
    expect(screen.queryByText('Entry saved on this browser.')).toBeNull();
    expect(
      screen
        .getByRole('button', { name: /Add entry/ })
        .hasAttribute('disabled'),
    ).toBe(true);
    await act(async () => {
      release?.();
      await gate;
    });
    await saved('Entry saved on this browser.');
  });
  it('renders hostile user markup as text and safe evidence links with isolation', async () => {
    await boot(
      makeData([
        makeEntry(1, {
          description: '<script>throw new Error("x")</script>',
          referenceUrl: 'https://example.org/work',
        }),
      ]),
    );
    expect(
      screen.getByText('<script>throw new Error("x")</script>'),
    ).toBeTruthy();
    const link = within(
      screen.getByRole('article', { name: 'Work entry on 2026-10-19' }),
    ).getByRole('link', { name: /Open evidence/ });
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
