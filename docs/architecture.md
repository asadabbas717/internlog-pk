# Architecture

## Feasibility

The MVP fits a static React application: all calculations and storage can run in the browser, with no backend or paid service. IndexedDB supports structured local records, and print HTML avoids a PDF dependency. Main risks are browser eviction, multi-tab edits, schema migrations, service-worker updates, and differing institutional rules. None can be solved by claims of permanent storage or official approval.

## Current modules

- `src/app/App.tsx`: accessible Phase 0 presentation and offline-status coordination.
- `src/infrastructure/offline/register.ts`: production-only browser registration and honest failure state.
- `src/styles`: shared design tokens and responsive CSS; no remote fonts or assets.
- `scripts/build-sw.mjs`: computes an asset-content revision and embeds the exact build inventory into the worker template.
- `scripts/build-notices.mjs`: preserves complete runtime dependency license notices in distributed output before the worker asset inventory is generated.
- `tests`: shell integration, registration unit, and production browser checks.

No domain rules, student persistence, or fake repository exist yet. Future pure domain modules own validation, totals and grouping. Infrastructure owns IndexedDB, serialization and export. Feature components coordinate interactions and call those contracts, without direct database access or duplicated business rules. Add abstractions only when they solve an actual problem.

## Offline lifecycle

Vite uses relative asset paths for repository-subpath compatibility. A production-only scoped worker precaches the complete build during install. Failed caching fails installation. No runtime responses are cached. Navigations to the scope root map to cached index.html; unrelated requests, query URLs and exports pass through. Activation removes only prior cache revisions belonging to this exact scope. New workers wait for old clients to close, avoiding mixed application revisions. Reopen all tabs to adopt an update. Initial access requires internet and HTTPS (localhost is allowed). Cache availability can later be revoked by the browser; readiness describes completed setup, not permanence.

## Later data design

See [requirements](requirements.md). Phase 1 will implement versioned IndexedDB initialization and atomic operations with runtime validation on every persisted read. Specify blocked upgrades, interrupted transactions and multi-tab concurrency before allowing writes. Avoid storing derived totals. Backup replacement must validate the complete envelope before a transaction and confirmation. No student data belongs in the service-worker cache, logs, fixtures or CI artifacts.
