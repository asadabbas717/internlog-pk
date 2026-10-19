import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LogbookReport } from '../../src/features/reports/LogbookReport';
import { makeData, makeEntry } from '../fixtures/data';

describe('saved-record logbook', () => {
  it('shows deterministic Monday weeks, exact day/week/grand totals and genuine blank review spaces', () => {
    render(
      <LogbookReport
        preview
        data={makeData([
          makeEntry(3, { date: '2026-10-26', durationMinutes: 61 }),
          makeEntry(2, { date: '2026-10-25', durationMinutes: 59 }),
          makeEntry(1, {
            date: '2026-10-19',
            durationMinutes: 90,
            description: '<img src=x onerror=alert(1)> پاکستانی',
          }),
          makeEntry(4, {
            date: '2026-10-19',
            durationMinutes: 1,
            referenceUrl: 'https://example.org/evidence',
          }),
        ])}
      />,
    );
    const weeks = screen.getAllByRole('region', { name: /Report week/ });
    expect(weeks.map((w) => w.getAttribute('aria-label'))).toEqual([
      'Report week beginning 2026-10-19',
      'Report week beginning 2026-10-26',
    ]);
    expect(weeks[0]?.textContent).toContain('Weekly total: 2h 30m');
    expect(weeks[1]?.textContent).toContain('Weekly total: 1h 1m');
    const first = weeks[0];
    if (!first) throw new Error('Missing week');
    const total = within(first).getByRole('row', {
      name: 'Daily total · 2026-10-19 1h 31m',
    });
    expect(total).toBeTruthy();
    expect(screen.getByText('3h 31m')).toBeTruthy();
    expect(
      screen.getByText('<img src=x onerror=alert(1)> پاکستانی'),
    ).toBeTruthy();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getAllByText(/Supervisor signature:/)).toHaveLength(2);
    expect(
      screen.getByText('Evidence: https://example.org/evidence'),
    ).toBeTruthy();
  });
  it('shows honest empty states and keeps saved data available for printing when preview is hidden', () => {
    const view = render(
      <LogbookReport preview data={{ profile: null, entries: [] }} />,
    );
    expect(screen.getByText(/Set up your internship profile/)).toBeTruthy();
    view.rerender(<LogbookReport preview data={makeData([])} />);
    expect(screen.getByText(/No saved work entries/)).toBeTruthy();
    // Preview visibility is presentation only; print always receives the same saved data.
    view.rerender(<LogbookReport preview={false} data={makeData()} />);
    expect(
      screen
        .getByRole('heading', { name: 'Internship logbook' })
        .closest('section')
        ?.classList.contains('report-preview'),
    ).toBe(false);
    expect(screen.getByText(makeEntry().description)).toBeTruthy();
  });
});
