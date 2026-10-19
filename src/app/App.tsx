import { useEffect, useState } from 'react';
import { prepareOffline } from '../infrastructure/offline/register';
import type { OfflineStatus } from '../infrastructure/offline/register';

const offlineMessages: Record<OfflineStatus, string> = {
  checking: 'Preparing offline access…',
  ready: 'Application shell ready for offline use on this browser.',
  unavailable: 'Offline setup unavailable. Reconnect and reload to retry.',
  development:
    'Development mode: offline caching is enabled in production builds only.',
};

export function App() {
  const [offline, setOffline] = useState<OfflineStatus>('checking');
  useEffect(() => {
    let active = true;
    void prepareOffline(import.meta.env.PROD).then((status) => {
      if (active) setOffline(status);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#main" aria-label="InternLog PK home">
          <span className="brand-mark" aria-hidden="true">
            IL
          </span>
          InternLog <span className="brand-country">PK</span>
        </a>
        <span className="phase-label">Phase 0 · Engineering foundation</span>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="welcome">
          <p className="eyebrow">Built for students. Grounded in real work.</p>
          <h1 id="welcome">
            Your internship,
            <br />
            <span>clearly recorded.</span>
          </h1>
          <p className="intro">
            A private place to organize your internship activities, understand
            your progress, and prepare records for supervisor review.
          </p>
          <p className="development-notice">
            <strong>
              The foundation is ready. The logbook is still in development.
            </strong>{' '}
            Profile setup, work entries, reports, and backups are planned for
            later phases. You cannot enter student records yet.
          </p>
          <a className="text-link" href="#roadmap">
            See what is being built <span aria-hidden="true">↓</span>
          </a>
        </section>
        <section className="principles" aria-label="Project principles">
          <article>
            <span className="card-number" aria-hidden="true">
              01
            </span>
            <h2>Private by design</h2>
            <p>
              No account, tracking, or analytics. Student records will stay in
              your browser, with backups you control.
            </p>
          </article>
          <article>
            <span className="card-number" aria-hidden="true">
              02
            </span>
            <h2>Ready for real life</h2>
            <p>
              The application shell can reopen offline after a successful online
              visit and caching. First access needs a connection.
            </p>
          </article>
          <article>
            <span className="card-number" aria-hidden="true">
              03
            </span>
            <h2>Your requirements</h2>
            <p>
              Future progress tracking will use your own required hours. Your
              university decides its reporting and credit requirements.
            </p>
          </article>
        </section>
        <section
          id="roadmap"
          className="roadmap"
          aria-labelledby="roadmap-title"
        >
          <div>
            <p className="eyebrow">A focused roadmap</p>
            <h2 id="roadmap-title">One dependable step at a time.</h2>
            <p>Only the engineering foundation is included in this build.</p>
          </div>
          <ol>
            <li>
              <strong>01 · Domain & local data</strong>
              <span>Validated records and IndexedDB persistence.</span>
            </li>
            <li>
              <strong>02 · Student workflows</strong>
              <span>Profile, daily work log, and progress dashboard.</span>
            </li>
            <li>
              <strong>03 · Reports & backups</strong>
              <span>Printable weekly records and validated JSON backups.</span>
            </li>
            <li>
              <strong>04 · Release hardening</strong>
              <span>Accessibility, mobile, offline, and security review.</span>
            </li>
          </ol>
        </section>
        <aside className="storage-note" aria-labelledby="storage-title">
          <h2 id="storage-title">Local does not mean permanent.</h2>
          <p>
            Browsers, operating systems, clearing site data, or device failure
            can remove local records. Regular backup export will be essential
            when record storage becomes available.
          </p>
          <p role="status">{offlineMessages[offline]}</p>
        </aside>
      </main>
      <footer>
        <strong>InternLog PK</strong>
        <p>
          An independent student tool. Not an official HEC or university
          application. Records do not certify attendance, approval, or academic
          credit.
        </p>
        <span>Open source · Apache-2.0</span>
      </footer>
    </>
  );
}
