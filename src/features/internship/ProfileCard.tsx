import type { InternshipProfile } from '../../domain/model';
import { durationLabel } from '../forms';

export function ProfileCard({
  profile,
  disabled,
  onEdit,
}: {
  profile: InternshipProfile | null;
  disabled: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="panel" aria-labelledby="internship-title">
      <div className="section-heading">
        <h2 id="internship-title">Your internship</h2>
        {profile && (
          <button
            className="text-button"
            type="button"
            disabled={disabled}
            onClick={onEdit}
          >
            Edit profile
          </button>
        )}
      </div>
      {profile ? (
        <dl className="profile-details">
          <div>
            <dt>Student</dt>
            <dd>{profile.studentName}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{profile.institution}</dd>
          </div>
          <div>
            <dt>Program</dt>
            <dd>{profile.program}</dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>{profile.organization}</dd>
          </div>
          <div>
            <dt>Supervisor</dt>
            <dd>{profile.supervisor || 'Not provided (optional)'}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              <time dateTime={profile.startDate}>{profile.startDate}</time> to{' '}
              <time dateTime={profile.endDate}>{profile.endDate}</time>
            </dd>
          </div>
          <div>
            <dt>Your target</dt>
            <dd>{durationLabel(profile.requiredMinutes)}</dd>
          </div>
        </dl>
      ) : (
        <p className="subtle">
          Your profile is not set up yet. Complete the form below to begin.
        </p>
      )}
    </section>
  );
}
