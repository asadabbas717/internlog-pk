import type { WorkEntry } from '../../domain/model';
import { durationLabel } from '../forms';

interface Props {
  entries: readonly WorkEntry[];
  disabled: boolean;
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}
export function EntryList({ entries, disabled, onEdit, onDelete }: Props) {
  const ordered = [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  if (ordered.length === 0)
    return (
      <div className="empty-state">
        <span aria-hidden="true" className="empty-icon">
          ＋
        </span>
        <h3>Your work belongs here.</h3>
        <p>
          Add a genuine work entry to start building your internship record.
        </p>
      </div>
    );
  return (
    <div className="entry-list">
      {ordered.map((entry) => (
        <article
          className="entry-card"
          key={entry.id}
          aria-label={`Work entry on ${entry.date}`}
        >
          <div className="entry-meta">
            <time dateTime={entry.date}>{entry.date}</time>
            <span>{durationLabel(entry.durationMinutes)}</span>
          </div>
          <h3>Work performed</h3>
          <p className="record-text">{entry.description}</p>
          <h4>Skills & learning</h4>
          <p className="record-text subtle">{entry.learningOutcomes}</p>
          {entry.referenceUrl && (
            <a
              className="evidence"
              href={entry.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open evidence <span className="subtle">(new tab)</span>
            </a>
          )}
          <div className="entry-actions">
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => {
                onEdit(entry);
              }}
            >
              Edit entry
            </button>
            <button
              type="button"
              className="text-button danger"
              disabled={disabled}
              onClick={() => {
                onDelete(entry);
              }}
            >
              Delete entry
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
