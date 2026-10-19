# Phase 1 acceptance and execution plan

Authorized by the phase review/resume request on 2026-10-20. Previous Phase 0: ACCEPTED WITH LIMITATIONS after clean npm ci, npm run check (7 tests), npm run test:e2e (4 tests) and successful hosted CI for 9e3317c. No blocking source defect found. The stale hosted-CI statement was corrected from actual run evidence. SVG installation icons and physical/cross-browser review remain nonblocking release work. Phase 1 is now accepted with limitations; final acceptance evidence lives in PROJECT_CONTEXT.md.

## Acceptance criteria

1. Explicit profile, entry and dataset contracts; unknown inputs validated at runtime with field-path errors. Enforce dates, trimmed bounded text, safe optional HTTP(S) URLs, integer minutes, UUID uniqueness, date ranges and daily aggregate limits. Empty state has no profile and no entries.
2. Deterministic duration conversion, Monday weeks, daily/weekly totals, distinct workdays and capped progress with visible excess minutes. Cover leap years, century rules, year boundaries, shuffled inputs and fractional/negative/nonfinite minutes.
3. Versioned, bounded serialization with strict envelope/schema rejection. This is an internal codec; no backup upload/download or replacement UI in this phase.
4. Native IndexedDB schema version 1; initialize only a new database, reject unknown/incompatible schemas without deletion, validate every read/write and resolve writes only after transaction completion.
5. Whole-dataset atomic saves compare an expected monotonic revision inside the read/write transaction. Reject stale writers and preserve newer data. Report unavailable, blocked, timed-out, quota/transaction, corrupt and unsupported-version failures without logging records or resetting the database. Close connections on versionchange.
6. Tests cover initialization (upgrade 0→1), reopen, corruption, unsupported versions, blocked opens, abort/rollback, stale and concurrent saves. No fictional legacy migration: future version changes require real data migrations and tests.
7. Real Chromium tests exercise the actual storage module through a development-only synthetic harness; production offline/browser regression tests still pass. No test harness in dist, no new student UI or production globals.
8. Full quality gates pass; critical domain coverage thresholds >=95% lines/statements/functions and >=90% branches. Documentation and fresh review record actual evidence and remaining limitations.

Implement pure domain first, then codec and native storage, then integration/browser tests. Keep the UI truthful about the new infrastructure stage while leaving Phase 2 workflows unimplemented. No new runtime dependency, no automatic publication/commit or Phase 2 continuation.
