# Controlled roadmap

Work on one phase at a time: inspect → plan → implement → test → review → document → report → stop. A later phase requires separate authorization.

| Phase                | Deliverable and acceptance                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (complete locally) | Functional shell, offline infrastructure, strict tooling, CI and handoff documents; requirements.md criteria and all applicable checks          |
| 1 (complete locally) | Pure models, runtime validation, minutes/dates/weeks, serialization and versioned IndexedDB; boundary, reload, upgrade and failure tests        |
| 2 (complete locally) | Profile and entry CRUD, progress and accessible recovery feedback; invalid submission, edit/delete and browser workflow tests                   |
| 3 (complete locally) | Accurate printable weekly reports and safe JSON backups; hostile input, corruption, replacement and report correctness tests                    |
| 4 (complete locally) | Mobile/accessibility/offline/security/performance review, cross-browser checks, manual Pages configuration, screenshots and release limitations |
| 5                    | Privacy-conscious pilot protocol; record only actual feedback and verified fixes; field validation separate from technical release              |

Phases 0–4 are accepted locally with documented limitations; see PROJECT_CONTEXT.md for dated verification. Phase 4 provides manual Pages publication configuration, not a live deployment. Hosted workflow execution, live HTTPS acceptance, physical-device installation, screen-reader use and native print destinations remain owner release checks in docs/release.md. No public site or field validation is claimed. After those release prerequisites are reviewed, Phase 5 pilot planning requires separate authorization; do not begin automatically.
