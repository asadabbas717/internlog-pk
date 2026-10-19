# Architecture

## Feasibility

The MVP fits a static React application: all calculations and storage can run in the browser, with no backend or paid service. IndexedDB supports structured local records, and print HTML avoids a PDF dependency. Main risks are browser eviction, multi-tab edits, schema migrations, service-worker updates, and differing institutional rules. None can be solved by claims of permanent storage or official approval.

## Current modules

- `src/app/App.tsx`: application landmarks, offline status and storage startup/recovery states.
- `src/app/useLogbook.ts`: one active validated snapshot and connection, loading/saving state, synchronous operation lock, generation-guarded effect cleanup and revision/conflict coordination. `Workspace.tsx` coordinates focused feature components without IndexedDB calls.
- `src/components`: labeled fields, focused error summaries and editor lifecycle/dirty-draft protections.
- `src/features/internship`, `work-log`, `progress`: profile form/details, entry form/list/delete confirmation and authoritative saved-snapshot dashboard. Form-local draft state is separate from persisted data.
- `src/domain`: readonly profile/entry/data contracts, strict runtime validation, calendar and duration arithmetic, authoritative progress and ordered daily/weekly summaries.
- `src/infrastructure/storage`: native IndexedDB adapter and bounded, versioned internal serialization; fixed error codes and optimistic revision checks.
- `src/infrastructure/offline/register.ts`: production-only browser registration and honest failure state.
- `src/styles`: shared design tokens and responsive CSS; no remote fonts or assets.
- `scripts/build-sw.mjs`: computes an asset-content revision and embeds the exact build inventory into the worker template.
- `scripts/build-notices.mjs`: preserves complete runtime dependency license notices in distributed output before the worker asset inventory is generated.
- `tests`: domain/codec/registration units, IndexedDB failure integration and real adapter browser tests alongside production shell/offline checks.

Domain modules own validation, profile/entry mutations, totals and grouping. Infrastructure owns IndexedDB, serialization, bounded portable backups and browser downloads. Feature components coordinate through these contracts, without direct database access or duplicated rules. `features/forms.ts` only parses digit-only input and formats integer durations. No state library or runtime dependency was added.

## Form and concurrency behavior

The app initializes storage and validates the current snapshot before displaying workflows. Corrupt/unavailable startup has explicit retry and no empty-logbook fallback. Writes resolve only after commit; pending operations disable competing actions. UI totals derive from committed snapshots, never draft fields.

Each editor owns its text until successful save or confirmed cancel. Page-unload warnings are best-effort browser protection, not crash recovery. A conflict/closed connection blocks saves until the user explicitly reloads latest records. The hook replaces the committed snapshot while editors stay mounted and retain their drafts. Latest saved profile and entries remain visible for comparison. A subsequent save reapplies only the intended mutation against the refreshed dataset; editing a now-deleted entry fails instead of resurrecting it. No silent merge, automatic stale retry or automatic form reset occurs.

Deletion uses a native modal dialog with initial focus on Keep entry, keyboard focus trapping, Escape cancellation and explicit permanent-delete action. Dirty editor cancellation uses browser confirmation. Entry duplicates receive a warning and an explicit Save distinct entry action; similar legitimate work is allowed. Evidence links are validated HTTP(S), rendered as text-safe React elements and opened with noopener/noreferrer. No schema or payload version changed.

## Offline lifecycle

Vite uses relative asset paths for repository-subpath compatibility. A production-only scoped worker precaches the complete build during install. Failed caching fails installation. No runtime responses are cached. Navigations to the scope root map to cached index.html; unrelated requests, query URLs and exports pass through. Activation removes only prior cache revisions belonging to this exact scope. New workers wait for old clients to close, avoiding mixed application revisions. Reopen all tabs to adopt an update. Initial access requires internet and HTTPS (localhost is allowed). Cache availability can later be revoked by the browser; readiness describes completed setup, not permanence.

## Local data design

See [requirements](requirements.md) and [ADR 0002](decisions/0002-validated-atomic-dataset.md). Schema v1 stores an internal JSON payload and revision in one `state/current` record. Initial upgrade 0→1 is atomic; future schema migrations are not invented. Every read/write is validated. Missing, corrupt or incompatible records are preserved with an error. A save checks the expected revision and resolves only after commit; stale saves fail without overwriting. Handles close on versionchange, and blocked/timed-out opens report errors and discard late connections. Derived totals are never stored. Backup replacement uses the same validated atomic save, expected revision and explicit confirmation. No real student data belongs in caches, logs, fixtures or CI artifacts.

## Reports and portable backups

`features/reports/LogbookReport.tsx` renders the saved snapshot with `summarizeProgress`; it duplicates no date or duration arithmetic. CSS hides the report on screen until preview, and hides interactive application content when printing. The report stays available for native Ctrl+P and the print button without storing derived data or opening a new window. Long text wraps; Monday weeks start new printed pages. Browser pagination/fonts/settings still need owner review.

`infrastructure/export/backup.ts` defines portable version 1 independently of database/internal payload versions. It bounds UTF-8 before parsing, rejects unknown envelope fields/versions and invokes domain validation and internal storage encoding before accepting a candidate. `files.ts` checks File.size before reading, rejects invalid UTF-8, starts a local Blob download with a fixed filename and later revokes the URL. Exports never enter service-worker caches or a server API.

`features/backup/BackupPanel.tsx` stages detached validated data with the inspected local revision. Inspection writes nothing. Native modal confirmation requires explicit acknowledgement; current-backup export is available before replacement. Saves use the existing session and transaction. A conflict preserves the candidate/current data; after explicit latest-record refresh the old inspection cannot confirm until a fresh review against that revision. Successful replacement closes/resets drafts (explicitly disclosed), and focuses the backup heading. Failure never resets the database. See ADR 0003.
