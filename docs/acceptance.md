# Deployment and manual acceptance record

Updated 2026-10-22 (Asia/Karachi). Status: **deployed release candidate, accepted on the owner's tested Android setup with the limitations below**. Phase 5 preparation is complete; actual student sessions/field validation remain NOT RUN.

## Independently checked deployment evidence

- Public address: [InternLog PK](https://asadabbas717.github.io/internlog-pk/). Read-only HTTP check returned 200 on 2026-10-22; this is availability evidence, not a new interactive browser test.
- [Publish GitHub Pages](https://github.com/asadabbas717/internlog-pk/actions/runs/39754053918) completed successfully for cdb90885302da57cca7a3b13fa94a6852274784f.
- [Quality gates](https://github.com/asadabbas717/internlog-pk/actions/runs/39499208126) completed successfully for the same commit. Fresh required local gates on 2026-10-22 passed: npm run check (205 unit/integration tests, types/lint/format/coverage/build), npm run test:e2e (84 tests in 3.4 minutes) and npm audit --audit-level=high (zero vulnerabilities). Application code is unchanged.
- These workflow/HTTP facts were checked independently through GitHub's public API and an HTTP request. The phone results below are the owner's reports, not agent-observed physical-device tests.

## Owner-reported manual results - 2026-10-22

One Android phone was used. Phone model, Android version and browser/TalkBack versions were not supplied. Do not generalize these results to other devices or browsers.

| Check                                                    | Reported environment                                 | Evidence / outcome                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile/entry save, reload, totals and offline readiness | Samsung Internet and Google Chrome on the same phone | Owner reported all guided basic checks passed. Samsung Internet's offline saving/installation was not separately established.                                                                                                                                    |
| Chrome installation and shared records                   | Chrome and the installed app                         | Owner installed from Chrome and saw the same records in both. Shared origin/profile storage is expected; this is not cloud sync or evidence of cross-browser synchronization.                                                                                    |
| Offline opening, saving and reopening                    | Chrome and the installed app                         | Owner reported all guided tests successful with and without internet. This is one-device acceptance, not an eviction/disk-failure or worker-upgrade experiment.                                                                                                  |
| Backup file download and replacement restoration         | Android walkthrough                                  | Owner reported the guided tests successful apart from an initial misunderstanding of cancellation. Also tested exporting A/B, adding C, deleting A/B and restoring A/B using replacement. Exact browser surface and file-management details were not supplied.   |
| Keep current records                                     | Backup replacement confirmation                      | Owner clarified that the confirmation closes while the inspection/review remains. Explained as intended cancellation, not a failed restore or verified application bug. Discard inspected backup separately dismisses the review without deleting saved records. |
| Native Print / Save as PDF                               | Android walkthrough; exact surface unspecified       | Owner confirmed the saved PDF opened, text was readable without clipping, entries/totals were correct and review/signature spaces remained blank. This does not establish physical printer output or tagged-PDF accessibility.                                   |
| Android TalkBack walkthrough                             | Chrome on the same Android phone                     | After the guided heading/control/field/error/delete-cancel focus checks, owner reported all tests successful as intended. No independent accessibility audit or coverage beyond that walkthrough is claimed.                                                     |

## Replacement semantics and deferred suggestion

Restore is whole-logbook replacement, not merge. With saved C and backup A/B: **Keep current records** leaves C and cancels restoration; **Replace all records** restores A/B and removes C. Export current records before restoring an older backup if a recovery copy is needed. The owner confirmed the distinction is clear.

Potential merge-import is a deferred feature suggestion, not a replacement-restore bug or an approved implementation. Preserving newer entries would require explicit duplicate-ID, edit/deletion and conflict rules, a separate design and tests. No merge feature or new phase is introduced by this record.

## Still NOT VERIFIED / NOT RUN

- Full physical iOS/Safari acceptance on the deployed site; earlier LAN save-fix acceptance does not cover this.
- Samsung Internet offline saving/installation, broader devices/versions and low-end physical-device performance.
- Physical printing, tagged-PDF accessibility and a comprehensive accessibility audit.
- Owner/device validation of the waiting-worker update path, browser eviction or real disk exhaustion. Existing automated worker/failure tests remain separate evidence.
- Actual student pilot sessions, usability findings from students, institutional endorsement or population-wide validation.

The [pilot protocol](pilot-protocol.md) is ready for a small controlled synthetic-data pilot after its preflight. Keep collecting only actual evidence in [pilot feedback](pilot-feedback.md). New features, further testing, recruitment and publication changes need their own instruction; this documentation synchronization performs none of them. Next action is owner-selected remaining device checks or actual pilot sessions, then review any genuine findings. No additional development phase is started automatically.
