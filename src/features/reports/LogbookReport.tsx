import { useMemo } from 'react';
import type { InternshipData } from '../../domain/model';
import { summarizeProgress } from '../../domain/progress';
import { durationLabel } from '../forms';

export function LogbookReport({
  data,
  preview,
}: {
  data: InternshipData;
  preview: boolean;
}) {
  const summary = useMemo(() => summarizeProgress(data), [data]);
  const profile = data.profile;
  return (
    <section
      className={`print-report${preview ? ' report-preview' : ''}`}
      aria-labelledby="report-title"
      id="report"
    >
      <h2 id="report-title">Internship logbook</h2>
      <p>Self-recorded activities · InternLog PK</p>
      <p className="report-disclaimer">
        Independent record organizer. This report does not certify attendance,
        supervisor approval or academic credit. University requirements differ.
        Only saved records are included.
      </p>
      {!profile ? (
        <p>Set up your internship profile before generating a logbook.</p>
      ) : (
        <>
          <dl className="report-profile">
            <dt>Student</dt>
            <dd>{profile.studentName}</dd>
            <dt>Institution / program</dt>
            <dd>
              {profile.institution} / {profile.program}
            </dd>
            <dt>Host organization</dt>
            <dd>{profile.organization}</dd>
            <dt>Supervisor</dt>
            <dd>{profile.supervisor || 'Not provided'}</dd>
            <dt>Internship dates</dt>
            <dd>
              {profile.startDate} to {profile.endDate}
            </dd>
            <dt>Configured target</dt>
            <dd>{durationLabel(profile.requiredMinutes)}</dd>
            <dt>Total recorded time</dt>
            <dd>{durationLabel(summary.recordedMinutes)}</dd>
            <dt>Recorded workdays</dt>
            <dd>{summary.workdays} (not verified attendance)</dd>
          </dl>
          {summary.weeks.length === 0 && (
            <p>
              No saved work entries. No attendance or activities are inferred.
            </p>
          )}
          {summary.weeks.map((week) => (
            <section
              className="report-week"
              key={week.startDate}
              aria-label={`Report week beginning ${week.startDate}`}
            >
              <h3>Week beginning {week.startDate}</h3>
              <p>
                Monday–Sunday · Weekly total:{' '}
                <strong>{durationLabel(week.minutes)}</strong>
              </p>
              <table>
                <caption>Saved activities and daily totals</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Work performed / learning outcomes</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                {week.days.map((day) => (
                  <tbody key={day.date}>
                    {day.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>
                          <p className="record-text">{entry.description}</p>
                          <p className="record-text">
                            <strong>Learning: </strong>
                            {entry.learningOutcomes}
                          </p>
                          {entry.referenceUrl && (
                            <p className="record-text">
                              Evidence: {entry.referenceUrl}
                            </p>
                          )}
                        </td>
                        <td>{durationLabel(entry.durationMinutes)}</td>
                      </tr>
                    ))}
                    <tr className="report-day-total">
                      <th scope="row" colSpan={2}>
                        Daily total · {day.date}
                      </th>
                      <td>{durationLabel(day.minutes)}</td>
                    </tr>
                  </tbody>
                ))}
              </table>
              <div className="review-spaces">
                <p>
                  For genuine review only. Blank spaces do not imply approval.
                </p>
                <p>
                  Student review / signature: ____________________ Date:
                  __________
                </p>
                <p>
                  Supervisor comments: _______________________________________
                </p>
                <p>
                  Supervisor signature: ________________________ Date:
                  __________
                </p>
              </div>
            </section>
          ))}
        </>
      )}
    </section>
  );
}
