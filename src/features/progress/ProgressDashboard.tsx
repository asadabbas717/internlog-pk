import { useMemo } from 'react';
import type { InternshipData } from '../../domain/model';
import { summarizeProgress } from '../../domain/progress';
import { durationLabel } from '../forms';

export function ProgressDashboard({ data }: { data: InternshipData }) {
  const summary = useMemo(() => summarizeProgress(data), [data]);
  const percentage =
    summary.percentage === null
      ? null
      : Math.floor(summary.percentage * 10) / 10;
  return (
    <section id="overview" aria-labelledby="overview-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your progress</p>
          <h2 id="overview-title">A little work. A lasting record.</h2>
        </div>
        <span className="subtle">Self-recorded activities</span>
      </div>
      {summary.incompleteProfile && (
        <p className="notice">
          Profile incomplete. <a href="#profile">Set up your internship</a> to
          configure your required hours and start recording work.
        </p>
      )}
      <div className="stats">
        <article>
          <h3>Recorded time</h3>
          <strong>{durationLabel(summary.recordedMinutes)}</strong>
        </article>
        <article>
          <h3>Required time</h3>
          <strong>
            {summary.requiredMinutes === null
              ? 'Not set'
              : durationLabel(summary.requiredMinutes)}
          </strong>
        </article>
        <article>
          <h3>Remaining time</h3>
          <strong>
            {summary.remainingMinutes === null
              ? 'Not set'
              : durationLabel(summary.remainingMinutes)}
          </strong>
        </article>
        <article>
          <h3>Recorded workdays</h3>
          <strong>{summary.workdays}</strong>
        </article>
      </div>
      <div className="progress-panel">
        <div className="section-heading">
          <span>
            {percentage === null
              ? 'Target not configured'
              : `${String(percentage)}% of your target recorded`}
          </span>
          {summary.excessMinutes > 0 && (
            <span>{durationLabel(summary.excessMinutes)} beyond target</span>
          )}
        </div>
        <progress
          max={100}
          value={summary.percentage ?? 0}
          aria-label="Recorded hours progress"
        />
        <p className="field-hint">
          Progress reflects your saved records. It is not verified attendance,
          supervisor approval, or academic credit.
        </p>
      </div>
      {summary.weeks.length > 0 && (
        <div className="weekly">
          <h3>Weekly totals</h3>
          <table>
            <caption>Weeks run Monday–Sunday.</caption>
            <thead>
              <tr>
                <th scope="col">Week beginning</th>
                <th scope="col">Recorded time</th>
                <th scope="col">Workdays</th>
              </tr>
            </thead>
            <tbody>
              {summary.weeks.map((week) => (
                <tr key={week.startDate}>
                  <th scope="row">
                    <time dateTime={week.startDate}>{week.startDate}</time>
                  </th>
                  <td>{durationLabel(week.minutes)}</td>
                  <td>{week.days.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
