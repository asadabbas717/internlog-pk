import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { StoredSnapshot } from '../infrastructure/storage/database';
import type {
  InternshipData,
  InternshipProfile,
  WorkEntry,
} from '../domain/model';
import { changeProfile, removeEntry, saveEntry } from '../domain/mutations';
import type { Issue, LogbookSession, SaveResult } from './useLogbook';
import { ProfileCard } from '../features/internship/ProfileCard';
import { ProfileForm } from '../features/internship/ProfileForm';
import { ProgressDashboard } from '../features/progress/ProgressDashboard';
import { EntryForm } from '../features/work-log/EntryForm';
import { EntryList } from '../features/work-log/EntryList';
import { DeleteDialog } from '../features/work-log/DeleteDialog';
import { StorageProblem } from './StorageProblem';
import { BackupPanel } from '../features/backup/BackupPanel';
import { LogbookReport } from '../features/reports/LogbookReport';

export function Workspace({
  snapshot,
  session,
}: {
  snapshot: StoredSnapshot;
  session: LogbookSession;
}) {
  const [editingProfile, setEditingProfile] = useState(
    snapshot.data.profile === null,
  );
  const [editor, setEditor] = useState<WorkEntry | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkEntry | null>(null);
  const [actionIssue, setActionIssue] = useState<Issue | null>(null);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const logTitle = useRef<HTMLHeadingElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const busy = session.loading || session.saving;
  const editing = editingProfile || editor !== null;
  useEffect(() => {
    if (pendingDelete !== null || !deleteTrigger.current) return;
    const trigger = deleteTrigger.current;
    deleteTrigger.current = null;
    // The native dialog has now been removed; restore a usable focus target.
    if (trigger.isConnected && !trigger.disabled) trigger.focus();
    else logTitle.current?.focus();
  }, [pendingDelete]);
  useEffect(() => {
    // Native Ctrl+P must receive the committed report before the browser captures it.
    const beforePrint = () => {
      flushSync(() => {
        setPrinting(true);
      });
    };
    const afterPrint = () => {
      setPrinting(false);
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  async function storeProfile(profile: InternshipProfile): Promise<SaveResult> {
    setNotice('');
    const result = await session.save((data) => changeProfile(data, profile));
    if (result.ok) {
      setEditingProfile(false);
      setNotice('Profile saved on this browser.');
    }
    return result;
  }
  async function storeEntry(entry: WorkEntry): Promise<SaveResult> {
    setNotice('');
    const result = await session.save((data) =>
      saveEntry(data, entry, editor === 'new' ? 'create' : 'edit'),
    );
    if (result.ok) {
      setEditor(null);
      setNotice('Entry saved on this browser.');
      logTitle.current?.focus();
    }
    return result;
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    setNotice('');
    setActionIssue(null);
    const result = await session.save((data) =>
      removeEntry(data, pendingDelete.id),
    );
    setPendingDelete(null);
    if (result.ok) {
      setNotice('Entry deleted from this browser.');
      logTitle.current?.focus();
    } else if (result.issue.code === 'validation') setActionIssue(result.issue);
  }
  async function refresh() {
    setNotice('');
    setActionIssue(null);
    if (await session.reload())
      setNotice(
        'Latest records loaded. Your draft is unchanged. Review the saved records before saving again.',
      );
  }
  function replaced(data: InternshipData) {
    setEditor(null);
    setEditingProfile(data.profile === null);
    setEditorGeneration((value) => value + 1);
    setNotice('');
    setActionIssue(null);
  }
  return (
    <>
      <div className="workspace-screen">
        {(session.problem ?? actionIssue) && (
          <StorageProblem
            issue={session.problem ?? actionIssue}
            busy={busy}
            onRetry={refresh}
            label="Load latest records (keep draft)"
          />
        )}
        {notice && (
          <p className="save-notice" role="status">
            {notice}
          </p>
        )}
        <ProgressDashboard data={snapshot.data} />
        <div className="workspace-grid">
          <section id="work-log" aria-labelledby="work-log-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Day by day</p>
                <h2 ref={logTitle} id="work-log-title" tabIndex={-1}>
                  Your work log
                </h2>
              </div>
              <button
                type="button"
                disabled={
                  !snapshot.data.profile ||
                  editing ||
                  busy ||
                  session.needsRefresh
                }
                onClick={() => {
                  setNotice('');
                  setEditor('new');
                }}
              >
                ＋ Add entry
              </button>
            </div>
            {!snapshot.data.profile && (
              <p className="field-hint">
                Complete your profile before adding work.
              </p>
            )}
            {editor !== null && snapshot.data.profile && (
              <EntryForm
                key={editorGeneration}
                initial={editor === 'new' ? null : editor}
                profile={snapshot.data.profile}
                data={snapshot.data}
                busy={busy}
                needsRefresh={session.needsRefresh}
                onSave={storeEntry}
                onCancel={() => {
                  setEditor(null);
                  logTitle.current?.focus();
                }}
              />
            )}
            <EntryList
              key={`entries-${String(editorGeneration)}`}
              entries={snapshot.data.entries}
              disabled={editing || busy || session.needsRefresh}
              onEdit={(entry) => {
                setNotice('');
                setEditor(entry);
              }}
              onDelete={(entry, trigger) => {
                deleteTrigger.current = trigger;
                setNotice('');
                setActionIssue(null);
                setPendingDelete(entry);
              }}
            />
          </section>
          <section id="profile" aria-label="Internship profile">
            <ProfileCard
              profile={snapshot.data.profile}
              disabled={editing || busy || session.needsRefresh}
              onEdit={() => {
                setNotice('');
                setEditingProfile(true);
              }}
            />
            {editingProfile && (
              <ProfileForm
                key={editorGeneration}
                initial={snapshot.data.profile}
                busy={busy}
                needsRefresh={session.needsRefresh}
                onSave={storeProfile}
                onCancel={
                  snapshot.data.profile
                    ? () => {
                        setEditingProfile(false);
                      }
                    : undefined
                }
              />
            )}
            <aside className="privacy-note">
              <h3>Private. Local. Yours.</h3>
              <p>
                No account, tracking, or server-side student storage. Browser
                data can be cleared, evicted, or lost with your device.
              </p>
              <p>
                Records belong to this browser profile and site address. A
                different browser or address opens a separate local logbook.
              </p>
              <p>
                <strong>Development build:</strong> export private backups
                regularly and check that they are saved outside this browser.
                Broader release testing is still in progress.
              </p>
            </aside>
          </section>
        </div>
        <section
          className="panel report-controls"
          aria-labelledby="report-controls-title"
        >
          <h2 id="report-controls-title">Reports</h2>
          <p>
            Preview saved records grouped by Monday–Sunday weeks. Print or
            choose Save as PDF in your browser. Open drafts are excluded.
            Printed files contain private information; review the destination
            and print settings.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              disabled={!snapshot.data.profile || busy}
              aria-expanded={preview}
              aria-controls="report"
              onClick={() => {
                setPreview(!preview);
              }}
            >
              {preview ? 'Hide logbook preview' : 'Preview saved logbook'}
            </button>
            <button
              type="button"
              disabled={!snapshot.data.profile || busy}
              onClick={() => {
                window.print();
              }}
            >
              Print / Save as PDF
            </button>
          </div>
        </section>
        <BackupPanel
          snapshot={snapshot}
          session={session}
          onReplaced={replaced}
        />
        {pendingDelete && (
          <DeleteDialog
            entry={pendingDelete}
            busy={busy}
            onCancel={() => {
              setPendingDelete(null);
            }}
            onConfirm={confirmDelete}
          />
        )}
      </div>
      {(preview || printing) && (
        <LogbookReport data={snapshot.data} preview={preview} />
      )}
    </>
  );
}
