import { useEffect, useRef, useState } from 'react';
import type { InternshipData } from '../../domain/model';
import type { StoredSnapshot } from '../../infrastructure/storage/database';
import type { LogbookSession } from '../../app/useLogbook';
import { describeIssue } from '../../app/useLogbook';
import {
  downloadBackup,
  readBackupFile,
} from '../../infrastructure/export/files';
import { summarizeProgress } from '../../domain/progress';
import { durationLabel } from '../forms';

const restoredMessage =
  'Backup restored on this browser. Replacement committed successfully.';

function ReplacementDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    cancel.current?.focus();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="replace-title"
      aria-describedby="replace-description"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onCancel();
      }}
    >
      <h2 id="replace-title">Replace this local logbook?</h2>
      <p id="replace-description">
        All current saved records and open unsaved drafts will be replaced. This
        is not a merge and has no undo. Cancel and export current records first
        if you need a recovery copy.
      </p>
      <label className="confirmation-check">
        <input
          type="checkbox"
          checked={acknowledged}
          disabled={busy}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
          }}
        />
        I understand that current records and unsaved drafts will be replaced.
      </label>
      <div className="form-actions">
        <button
          ref={cancel}
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Keep current records
        </button>
        <button
          type="button"
          className="danger-button"
          disabled={busy || !acknowledged}
          onClick={() => {
            void onConfirm();
          }}
        >
          {busy ? 'Replacing…' : 'Replace all records'}
        </button>
      </div>
    </dialog>
  );
}

export function BackupPanel({
  snapshot,
  session,
  onReplaced,
}: {
  snapshot: StoredSnapshot;
  session: LogbookSession;
  onReplaced: (data: InternshipData) => void;
}) {
  const [candidate, setCandidate] = useState<{
    data: InternshipData;
    revision: number;
  } | null>(null);
  const [reading, setReading] = useState(false);
  const readingRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const chooseRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // The modal must be removed before focus can move outside its inert subtree.
    if (message === restoredMessage) titleRef.current?.focus();
  }, [message]);
  const busy = reading || session.loading || session.saving;
  const stale = candidate !== null && candidate.revision !== snapshot.revision;
  const summary = candidate ? summarizeProgress(candidate.data) : null;
  function exportCurrent() {
    setError('');
    setMessage('');
    try {
      downloadBackup(snapshot.data);
      setMessage(
        'Backup download requested. Check that the file was saved; keep a private copy outside this browser.',
      );
    } catch {
      setError(
        'Backup download could not be started. Your records are unchanged. Retry or check browser download settings.',
      );
    }
  }
  async function inspect(file: File) {
    if (readingRef.current) return;
    readingRef.current = true;
    setReading(true);
    setCandidate(null);
    setError('');
    setMessage('');
    const revision = snapshot.revision;
    try {
      setCandidate({ data: await readBackupFile(file), revision });
    } catch (issue) {
      setError(describeIssue(issue).message);
    } finally {
      readingRef.current = false;
      setReading(false);
    }
  }
  async function replace() {
    if (!candidate || stale || session.needsRefresh || busy) return;
    const result = await session.save(() => candidate.data);
    setConfirming(false);
    if (result.ok) {
      onReplaced(candidate.data);
      setCandidate(null);
      setMessage(restoredMessage);
    } else setError(result.issue.message);
  }
  return (
    <section
      className="panel backup-panel"
      aria-labelledby="backup-title"
      id="backups"
    >
      <h2 id="backup-title" ref={titleRef} tabIndex={-1}>
        Backups and recovery
      </h2>
      <p>
        Export saved records regularly. JSON backups contain private,
        unencrypted profile and work details. Keep them somewhere safe; browser
        storage can be lost.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={busy || session.needsRefresh}
        onClick={exportCurrent}
      >
        Export current backup
      </button>
      <div className="field">
        <label htmlFor="backup-file">Choose JSON backup to inspect</label>
        <p className="field-hint" id="backup-file-hint">
          Maximum 5 MiB, UTF-8 JSON. Inspection changes no records. Import
          replaces the entire logbook after confirmation.
        </p>
        <input
          ref={chooseRef}
          id="backup-file"
          type="file"
          accept=".json,application/json"
          aria-describedby="backup-file-hint"
          disabled={busy || session.needsRefresh}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void inspect(file);
          }}
        />
      </div>
      {reading && <p role="status">Validating backup…</p>}
      {error && (
        <p role="alert" className="error-summary">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="save-notice">
          {message}
        </p>
      )}
      {candidate && summary && (
        <div className="backup-review" aria-label="Backup inspection">
          <h3>Review before replacement</h3>
          <p>
            Incoming student:{' '}
            <strong>
              {candidate.data.profile?.studentName ??
                'No profile (empty logbook)'}
            </strong>
          </p>
          <p>
            Incoming organization:{' '}
            {candidate.data.profile?.organization ?? 'Not set'}
          </p>
          {candidate.data.profile && (
            <p>
              Incoming dates: {candidate.data.profile.startDate} to{' '}
              {candidate.data.profile.endDate}
            </p>
          )}
          <p>
            Incoming: {candidate.data.entries.length} entries ·{' '}
            {durationLabel(summary.recordedMinutes)}
          </p>
          <p>
            Current saved logbook:{' '}
            {snapshot.data.profile?.studentName ?? 'No profile'} ·{' '}
            {snapshot.data.entries.length} entries
          </p>
          <p>
            Only restore a backup you recognize. The application validates
            structure and values, not whether its activities are truthful.
          </p>
          {stale && (
            <p role="status">
              Saved records changed after inspection. Review the latest saved
              records and export them before confirming again.
            </p>
          )}
          <div className="form-actions">
            {stale ? (
              <button
                type="button"
                disabled={busy || session.needsRefresh}
                onClick={() => {
                  setCandidate({ ...candidate, revision: snapshot.revision });
                  setError('');
                }}
              >
                Review replacement against latest records
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || session.needsRefresh}
                onClick={() => {
                  setConfirming(true);
                  setError('');
                }}
              >
                Continue to replacement confirmation
              </button>
            )}
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setCandidate(null);
                chooseRef.current?.focus();
              }}
            >
              Discard inspected backup
            </button>
          </div>
        </div>
      )}
      {confirming && (
        <ReplacementDialog
          busy={busy}
          onCancel={() => {
            setConfirming(false);
          }}
          onConfirm={replace}
        />
      )}
    </section>
  );
}
