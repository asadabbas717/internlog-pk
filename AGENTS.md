# InternLog PK engineering instructions

- Read PROJECT_CONTEXT.md and inspect actual files and `git status` first. Code and Git override stale handoff claims. Preserve existing work and student data.
- Implement exactly the separately authorized phase; follow inspect → plan → implement → test → review → document → report → stop. Do not continue automatically.
- Scope: independent student record organization, React/strict TypeScript/Vite/plain CSS/native IndexedDB, browser print HTML. No backend, accounts, analytics, paid APIs, fabricated work/endorsements or unapproved features.
- Keep calculations/validation pure in domain; minutes are integers, dates are calendar-only strings, weeks Monday–Sunday. Runtime-validate persisted/imported values. UI must not duplicate rules or directly implement IndexedDB.
- Use the revision from `load()` when calling storage `save(data, expectedRevision)`. Preserve unsaved edits on conflict and require review of the latest data; never auto-retry stale snapshots or silently reset corrupt storage. Schema changes need preserving migrations and tests; version 1 currently has only initial upgrade 0→1.
- No unsafe HTML/eval, student data in logs or fixtures, embedded secrets, `any`, unexplained unsafe casts, forced dependency installs or suppressed failures. Bound imports and text. Confirm destructive actions and preserve valid data on failure.
- Use centralized CSS tokens, semantic HTML, associated labels, visible focus and keyboard/mobile access. Keep current development and release status honest.
- When connected, include the owner's installed Chrome in visible UI smoke checks with synthetic data on a separate test origin. Preserve existing records/caches; distinguish these checks from Playwright Chromium and physical-device testing.
- Mandatory gates: `npm run check`, `npm run test:e2e` and `npm audit --audit-level=high`. Install browsers via `npx playwright install chromium` if needed. Do not skip/weaken tests or gates. Label unavailable checks NOT VERIFIED with the exact blocker.
- Test calculations, boundaries, upgrades, transaction failures, imports and offline behavior as they become applicable. No real student data. Review dependency licenses and security changes.
- Update README and affected docs with behavior; record dated actual results, limitations, git state and exact next action in PROJECT_CONTEXT.md at every phase boundary. Never preserve stale passing claims after changes.
- A phase is complete only when its acceptance criteria, applicable checks, critical review and documentation are complete. Report real evidence and stop. No destructive Git history, force push or automatic merge.
