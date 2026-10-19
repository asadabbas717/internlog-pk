# Controlled roadmap

Work on one phase at a time: inspect → plan → implement → test → review → document → report → stop. A later phase requires separate authorization.

| Phase                | Deliverable and acceptance                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (complete locally) | Functional shell, offline infrastructure, strict tooling, CI and handoff documents; requirements.md criteria and all applicable checks          |
| 1 (complete locally) | Pure models, runtime validation, minutes/dates/weeks, serialization and versioned IndexedDB; boundary, reload, upgrade and failure tests        |
| 2 (complete locally) | Profile and entry CRUD, progress and accessible recovery feedback; invalid submission, edit/delete and browser workflow tests                   |
| 3 (complete locally) | Accurate printable weekly reports and safe JSON backups; hostile input, corruption, replacement and report correctness tests                    |
| 4                    | Mobile/accessibility/offline/security/performance review, cross-browser checks, Pages deployment, synthetic screenshots and release limitations |
| 5                    | Privacy-conscious pilot protocol; record only actual feedback and verified fixes; field validation separate from technical release              |

Phases 0, 1, 2 and 3 are accepted with documented limitations. The next planned scope after separate authorization is Phase 4 only: release hardening, broader browser/device/accessibility/offline/security/performance checks and planned Pages deployment. GitHub Pages deployment remains Phase 4 work; nothing is published by this phase.
