import { useEffect, useRef } from 'react';
import type { WorkEntry } from '../../domain/model';

export function DeleteDialog({
  entry,
  busy,
  onCancel,
  onConfirm,
}: {
  entry: WorkEntry;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onCancel();
      }}
    >
      <h2 id="delete-title">Delete this work entry?</h2>
      <p id="delete-description">
        The entry dated {entry.date} will be removed from this browser. This
        cannot be undone.
      </p>
      <blockquote className="record-text">{entry.description}</blockquote>
      <div className="form-actions">
        <button
          ref={cancelRef}
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Keep entry
        </button>
        <button
          type="button"
          className="danger-button"
          disabled={busy}
          onClick={() => {
            void onConfirm();
          }}
        >
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div>
    </dialog>
  );
}
