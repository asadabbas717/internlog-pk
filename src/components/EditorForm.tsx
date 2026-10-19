import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Issue } from '../app/useLogbook';

export interface FormIssue {
  field: string;
  message: string;
}
export function formIssue(issue: Issue): FormIssue {
  return {
    field: issue.path?.split('.').at(-1) ?? 'form',
    message: issue.message,
  };
}
export function fieldError(
  issue: FormIssue | null,
  field: string,
): string | undefined {
  return issue?.field === field ? issue.message : undefined;
}

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  dirty: boolean;
  busy: boolean;
  issue: FormIssue | null;
  submitLabel: string;
  submitDisabled?: boolean;
  focusOnMount?: boolean;
  onSubmit: () => Promise<void>;
  onCancel?: (() => void) | undefined;
}

export function EditorForm({
  id,
  title,
  children,
  dirty,
  busy,
  issue,
  submitLabel,
  submitDisabled = false,
  focusOnMount = true,
  onSubmit,
  onCancel,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (focusOnMount) titleRef.current?.focus();
  }, [focusOnMount]);
  useEffect(() => {
    if (issue) {
      const input = document.getElementById(`${id}-${issue.field}`);
      if (input) input.focus();
      else errorRef.current?.focus();
    }
  }, [issue, id]);
  useEffect(() => {
    if (!dirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', preventLoss);
    return () => {
      window.removeEventListener('beforeunload', preventLoss);
    };
  }, [dirty]);
  return (
    <form
      className="panel editor"
      aria-labelledby={`${id}-title`}
      aria-busy={busy}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <h3 id={`${id}-title`} ref={titleRef} tabIndex={-1}>
        {title}
      </h3>
      {issue && (
        <p className="error-summary" role="alert" ref={errorRef} tabIndex={-1}>
          {issue.message}
        </p>
      )}
      <fieldset disabled={busy}>
        {children}
        <div className="form-actions">
          <button type="submit" disabled={submitDisabled}>
            {busy ? 'Please wait…' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (!dirty || window.confirm('Discard this unsaved draft?'))
                  onCancel();
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
