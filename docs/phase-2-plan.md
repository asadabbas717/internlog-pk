# Phase 2 acceptance plan

Authorized by the phase review/resume request on 2026-10-20. Phase 1 was accepted with limitations after source/test/architecture review, clean npm ci, npm run check (152 tests), eight browser tests and [hosted CI success](https://github.com/asadabbas717/internlog-pk/actions/runs/39330161352). No blocking source defect found. The first install's Windows file lock was resolved by stopping our earlier preview server; no quality gate was bypassed.

## Acceptance

1. Complete create/edit profile form, including configurable hours/minutes target, optional supervisor and calendar dates; no universal-hours claim. Blank, malformed, fractional, oversized and out-of-range values fail visibly, with associated field errors and focus. Existing entries cannot be excluded by profile date edits.
2. Add/list/edit entries with work date, description, integer hours/minutes, learning outcomes and optional safe evidence URL. Warn about similar-looking records while allowing confirmed distinct work. No fabricated samples in a fresh user's database.
3. Confirm deletion in an accessible dialog; cancel preserves records. Warn before abandoning dirty forms. Keep drafts after failed saves. Disable competing operations until a save commits; show success only after commit.
4. Dashboard and weekly totals use the single domain summary over persisted snapshots. Show recorded/required/remaining, progress/excess, workday count and incomplete profile. Counts never imply verified attendance or approval.
5. Connect the actual IndexedDB adapter through one small application hook. Loading, corrupt/unavailable storage and retry states are honest; no empty-state fallback for corrupt data. On stale/closed connection errors block further saves until an explicit latest-record refresh. Refresh preserves open drafts; user reviews latest records before explicitly resubmitting. Deleted entries must not be resurrected as edits.
6. Responsive semantic UI, keyboard operation, reduced motion, visible focus, safe text rendering and explicit external-link behavior. Keep privacy/independence and browser-data-loss notices; clearly mark backups/reports unavailable in this development build.
7. Meaningful form/CRUD/reload/failure/conflict integration tests; production desktop/mobile browser workflow, real offline reopening with saved student fixtures, stale-tab conflict, and axe checks. Installed Chrome smoke test with synthetic records and preserved existing data. No new dependency required.
8. All existing gates and critical domain coverage thresholds pass. Fresh review, documentation, actual verification evidence and remaining limitations recorded before stopping. No Phase 3 implementation or automatic commit/push/deployment.

Implementation: focused domain mutations and duration adapters; storage coordination hook; reusable accessible field/form primitives; profile/work-log/progress components; then tests, browser review and documentation. Keep schema/payload version 1 and preserve current records.

Outcome: COMPLETE locally, ACCEPTED WITH LIMITATIONS. All eight criteria verified within the recorded scope. Final gates: 185 unit/integration tests and 16 desktop/mobile browser tests passed; installed Chrome saved synthetic records and reopened them with the preview server stopped. See ../PROJECT_CONTEXT.md for exact evidence, review fixes and release limitations. Phase 3, publication and deployment were not performed.
