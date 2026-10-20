# Feedback and field-validation record

Updated 2026-10-21. **No student pilot sessions or student findings have been provided or conducted in this phase.** No participant count, usability score, testimonial or field-validation outcome is claimed. The [protocol](pilot-protocol.md) is prepared for later use; automated browser results are engineering evidence, not participant feedback.

## Actual owner feedback already received

These maintenance reports came from the owner in the project chat. They are not student-pilot sessions and do not establish device versions or completion of every manual release check.

| Reference / date  | Report and impact                                                                                                       | Correction and evidence                                                                                                                                                                           | Current status                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| O-01 / 2026-10-21 | Owner saw unstyled HTML after npm run dev in Chrome and Firefox. HIGH: development UI presentation broken.              | dd6179c: development-only policy permits Vite's injected CSS; production remains strict. development.spec.ts checks computed styles and CSP in all four projects.                                 | Verified by automated checks; owner later reported everything fine.                                                                     |
| O-02 / 2026-10-21 | Owner saw an access-local-records warning on entry save over LAN HTTP on iOS and Android. HIGH: new-entry save blocked. | dd6179c: UUID v4 IDs use getRandomValues instead of secure-context-only randomUUID. network-entry.spec.ts saves, reloads and edits on genuine non-secure HTTP; entry-id.test.ts checks UUID bits. | Verified by automated checks; owner later reported everything fine. Exact phone versions and individual retest steps were not supplied. |

Both fixes are committed in [dd6179c](https://github.com/asadabbas717/internlog-pk/commit/dd6179ca6b47245fcfd62d735974230ea8e424af). Current independent audit passed 205 unit/integration tests, all 84 browser checks and the production build; dependency audit found zero vulnerabilities. Hosted Node 24 [quality run](https://github.com/asadabbas717/internlog-pk/actions/runs/39496561256) also passed. The owner's general acceptance is not evidence of a formal pilot, screen-reader use or live HTTPS installation.

## Minimal future session record

The following is an unused template, not an existing participant or result. Record only consented technical notes after an actual session. Omit identifiers, contacts, institutions, employers, real records and identifying screenshots. Use broad browser/OS information; add a version only when needed to reproduce an issue. Do not create an identity lookup table.

```text
Session code / date / actual build commit:
Browser/OS family and test mode:
Voluntary participation and public technical notes agreed: yes (otherwise no session record)
Task outcomes: independent / assisted / not completed / not run, with reason
Assistance given:
Observed difficulty (short de-identified paraphrase):
Expected / actual behavior and synthetic reproduction:
Classification: observed defect / unverified report / suggestion
Severity and evidence (if a defect):
Disposition: unresolved / reproduced / fixed and verified / deferred
Fix commit and exact verification, or reason still open:
Participant reviewed retained notes: yes/no
```

## Unresolved findings and recommendations

No unresolved student findings or feature recommendations have been supplied. Do not populate results from expectations in the protocol. Keep any future unverified report open until reproduced or explicitly explained; track deferred suggestions here with rationale rather than presenting them as implemented.

Existing release checks remain open in the [release guide](release.md): live HTTPS/Pages publication and install/offline acceptance, intended-device screen-reader/native print behavior and low-end physical-device performance. They are unverified acceptance work, not invented pilot failures. Before scheduling sessions, the owner reviews the protocol preflight and chooses a safe synthetic test environment. Actual field validation remains NOT RUN.
