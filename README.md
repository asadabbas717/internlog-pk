# InternLog PK

A privacy-first, open-source internship logbook for computing students in Pakistan. It will organize genuine activities, configurable working-hour targets and printable weekly records. Independent of HEC and universities; it cannot certify attendance or guarantee academic credit.

**Current status: Phase 2 student workflows (development build).** Set up/edit a profile, configure your required hours and minutes, add/edit/delete authentic work entries, and view saved-record progress and Monday–Sunday weekly totals. Records persist in IndexedDB and work offline after successful production caching. Reports and portable backup controls are not implemented yet; use synthetic records until the backup workflow is ready. There are no accounts, analytics, paid APIs or server-side student records.

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

Start with [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [requirements](docs/requirements.md), [architecture](docs/architecture.md) and the [roadmap](docs/roadmap.md). Pure rules live in `src/domain`; native IndexedDB and the internal codec live in `src/infrastructure/storage`; focused UI lives in `src/features`. `src/app/useLogbook.ts` coordinates reads and revision-checked writes. See [ADR 0002](docs/decisions/0002-validated-atomic-dataset.md) for schema changes and failure handling.

Records belong to the browser profile and site address you use. Switching between development/preview ports, browsers or deployed sites opens separate storage. Conflicting saves keep the draft and require **Load latest records (keep draft)**, review, then an explicit save; do not blindly reapply old records. Corrupt storage is never reset automatically. Cancelled/failed deletions preserve records; confirmed deletion has no undo. Unsaved forms request confirmation before cancellation or page navigation, but cannot survive browser/device failure.

Contribute through [CONTRIBUTING.md](CONTRIBUTING.md). See [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [Apache-2.0 license](LICENSE). No physical-device, institutional or real-student validation is claimed.
