import { useEffect, useRef } from 'react';
import type { Issue } from './useLogbook';

export function StorageProblem({
  issue,
  busy,
  onRetry,
  label = 'Retry local storage',
}: {
  issue: Issue | null;
  busy: boolean;
  onRetry: () => Promise<unknown>;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (issue) ref.current?.focus();
  }, [issue]);
  if (!issue) return null;
  return (
    <div className="error-panel" role="alert" ref={ref} tabIndex={-1}>
      <h2>Records need your attention</h2>
      <p>{issue.message}</p>
      <p>
        Unsaved form text stays here. Do not clear site data to resolve this
        error.
      </p>
      <button
        className="secondary"
        type="button"
        disabled={busy}
        onClick={() => {
          void onRetry();
        }}
      >
        {busy ? 'Loading…' : label}
      </button>
    </div>
  );
}
