# ADR 0001: Static, local-first foundation

Status: accepted for Phase 0, 2026-10-20.

Use React/strict TypeScript/Vite and plain CSS, IndexedDB in Phase 1, and browser printing in Phase 3. This meets the no-account/no-server requirement and keeps hosting free. Browser eviction and device loss require explicit backup messaging and later export/import; local storage is not a guarantee.

Use a small generated service worker rather than an additional PWA framework. Cache only a content-versioned build inventory and wait for old tabs to close before activation. This limits cache scope and dependency weight at the cost of owning worker lifecycle tests. Relative Vite paths support both root and project hosting.

Resolve stable packages from the npm registry at implementation time and retain the lockfile. Prefer the newest peer-compatible toolchain, not forced installs. Node 24 is the contributor/CI baseline; the initial local environment has Node 26.7.0/npm 12.0.2. Record actual compatibility and verification results in PROJECT_CONTEXT.md.
