# Architecture

## Feasibility

The MVP fits a static React application: all calculations and storage can run in the browser, with no backend or paid service. IndexedDB supports structured local records, and print HTML avoids a PDF dependency. Main risks are browser eviction, multi-tab edits, schema migrations, service-worker updates, and differing institutional rules. None can be solved by claims of permanent storage or official approval.

## Current modules

- `src/app/App.tsx`: accessible development shell and offline-status coordination; no student workflows yet.
- `src/domain`: readonly profile/entry/data contracts, strict runtime validation, calendar and duration arithmetic, authoritative progress and ordered daily/weekly summaries.
- `src/infrastructure/storage`: native IndexedDB adapter and bounded, versioned internal serialization; fixed error codes and optimistic revision checks.
- `src/infrastructure/offline/register.ts`: production-only browser registration and honest failure state.
- `src/styles`: shared design tokens and responsive CSS; no remote fonts or assets.
- `scripts/build-sw.mjs`: computes an asset-content revision and embeds the exact build inventory into the worker template.
- `scripts/build-notices.mjs`: preserves complete runtime dependency license notices in distributed output before the worker asset inventory is generated.
- `tests`: domain/codec/registration units, IndexedDB failure integration and real adapter browser tests alongside production shell/offline checks.

Domain modules own validation, totals and grouping. Infrastructure owns IndexedDB and serialization; export controls are Phase 3. Phase 2 feature components will coordinate interactions through these contracts, without direct database access or duplicated rules. Add abstractions only when they solve an actual problem. The public shell does not initialize or write student storage yet.

## Offline lifecycle

Vite uses relative asset paths for repository-subpath compatibility. A production-only scoped worker precaches the complete build during install. Failed caching fails installation. No runtime responses are cached. Navigations to the scope root map to cached index.html; unrelated requests, query URLs and exports pass through. Activation removes only prior cache revisions belonging to this exact scope. New workers wait for old clients to close, avoiding mixed application revisions. Reopen all tabs to adopt an update. Initial access requires internet and HTTPS (localhost is allowed). Cache availability can later be revoked by the browser; readiness describes completed setup, not permanence.

## Local data design

See [requirements](requirements.md) and [ADR 0002](decisions/0002-validated-atomic-dataset.md). Schema v1 stores an internal JSON payload and revision in one `state/current` record. Initial upgrade 0→1 is atomic; future schema migrations are not invented. Every read/write is validated. Missing, corrupt or incompatible records are preserved with an error. A save checks the expected revision and resolves only after commit; stale saves fail without overwriting. Handles close on versionchange, and blocked/timed-out opens report errors and discard late connections. Derived totals are never stored. Future backup replacement needs validation and explicit confirmation. No real student data belongs in caches, logs, fixtures or CI artifacts.
