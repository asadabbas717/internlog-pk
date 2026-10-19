# InternLog PK

A privacy-first, open-source internship logbook for computing students in Pakistan. It will organize genuine activities, configurable working-hour targets and printable weekly records. Independent of HEC and universities; it cannot certify attendance or guarantee academic credit.

**Current status: Phase 1 domain and local-data foundation.** Runtime-validated models, minute/date calculations, progress summaries, bounded serialization and an IndexedDB adapter are implemented. The public application remains a development shell: profile/entry forms, a progress dashboard, reports and backup controls arrive in later phases. You cannot enter student records yet. There are no accounts, analytics, paid APIs or server-side student records.

## Getting started

Use Node.js 24.x and npm 11–12 (Node 26.x is also accepted). Install Node before continuing. The lockfile fixes dependency resolution.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. For production/offline testing:

```sh
npm run build
npm run preview
```

Offline caching requires one successful online production visit, supported service workers and HTTPS or localhost. The status message reports completion. Development mode does not cache. Close all app tabs and reopen to adopt a new cached version. Browser installation support varies; the initial SVG manifest icon is not sufficient for every platform's installation UI. Browser-local data and caches can be cleared or lost; backup workflows are planned before student-record release.

## Quality checks

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

`npm run format` formats source. See [testing](docs/testing.md) for coverage and manual checks. CI runs the same gates on Node 24. GitHub Pages deployment belongs to Phase 4; the build already uses relative paths for project hosting.

Start with [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [requirements](docs/requirements.md), [architecture](docs/architecture.md) and the [roadmap](docs/roadmap.md). Pure rules live in `src/domain`; native IndexedDB and the versioned internal codec live in `src/infrastructure/storage`. The adapter validates each read/write, commits whole datasets atomically and refuses stale-tab overwrites. See [ADR 0002](docs/decisions/0002-validated-atomic-dataset.md) for schema changes, failures and revision handling. No data is persisted by the public shell yet.

Contribute through [CONTRIBUTING.md](CONTRIBUTING.md). See [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [Apache-2.0 license](LICENSE). No physical-device, institutional or real-student validation is claimed.
