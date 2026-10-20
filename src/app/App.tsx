import { useEffect, useState } from 'react';
import { prepareOffline } from '../infrastructure/offline/register';
import type { OfflineStatus } from '../infrastructure/offline/register';
import { useLogbook } from './useLogbook';
import type { OpenDatabase } from './useLogbook';
import { StorageProblem } from './StorageProblem';
import { Workspace } from './Workspace';

const offlineMessages: Record<OfflineStatus, string> = {
  checking: 'Preparing offline access…',
  ready: 'Application ready for offline use on this browser.',
  unavailable: 'Offline setup unavailable. Reconnect and reload to retry.',
  development:
    'Development mode: offline caching is enabled in production builds only.',
};

export function App({ openDatabase }: { openDatabase?: OpenDatabase } = {}) {
  const session = useLogbook(openDatabase);
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
      <a className="skip-link" href="#main" tabIndex={0}>
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#main" aria-label="InternLog PK home">
          <span className="brand-mark" aria-hidden="true">
            IL
          </span>
          InternLog <span className="brand-country">PK</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#overview">Overview</a>
          <a href="#work-log">Work log</a>
          <a href="#profile">Profile</a>
        </nav>
        <span className="local-badge">On this browser only</span>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="page-intro">
          <div>
            <p className="eyebrow">Your internship companion</p>
            <h1>
              Your internship, <span>clearly recorded.</span>
            </h1>
            <p className="subtle">
              Build an honest record of the work you do and the things you
              learn.
            </p>
          </div>
          <span className="phase-label">Phase 4 · Release candidate</span>
        </div>
        {session.snapshot ? (
          <Workspace snapshot={session.snapshot} session={session} />
        ) : (
          <section className="panel" aria-label="Local storage setup">
            {session.loading ? (
              <p role="status">Opening your local records…</p>
            ) : (
              <StorageProblem
                issue={session.problem}
                busy={session.loading}
                onRetry={session.reload}
              />
            )}
          </section>
        )}
        <aside className="storage-note" aria-labelledby="storage-title">
          <h2 id="storage-title">Local does not mean permanent.</h2>
          <p>
            Clearing site data, browser eviction, operating-system cleanup, or
            device failure can remove your records. Keep original evidence
            separately. Export backups regularly and verify that the files are
            saved outside this browser.
          </p>
          <p role="status" aria-label="Offline availability">
            {offlineMessages[offline]}
          </p>
        </aside>
      </main>
      <footer>
        <strong>InternLog PK</strong>
        <p>
          An independent student tool. Not an official HEC or university
          application. Records do not certify attendance, approval, or academic
          credit. University requirements differ.
        </p>
        <span>Open source · Apache-2.0</span>
      </footer>
    </>
  );
}
