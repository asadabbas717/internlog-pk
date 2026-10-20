# Controlled roadmap

Work on one phase at a time: inspect → plan → implement → test → review → document → report → stop. A later phase requires separate authorization.

| Phase                    | Deliverable and acceptance                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (complete locally)     | Functional shell, offline infrastructure, strict tooling, CI and handoff documents; requirements.md criteria and all applicable checks          |
| 1 (complete locally)     | Pure models, runtime validation, minutes/dates/weeks, serialization and versioned IndexedDB; boundary, reload, upgrade and failure tests        |
| 2 (complete locally)     | Profile and entry CRUD, progress and accessible recovery feedback; invalid submission, edit/delete and browser workflow tests                   |
| 3 (complete locally)     | Accurate printable weekly reports and safe JSON backups; hostile input, corruption, replacement and report correctness tests                    |
| 4 (complete locally)     | Mobile/accessibility/offline/security/performance review, cross-browser checks, manual Pages configuration, screenshots and release limitations |
| 5 (preparation complete) | Privacy-conscious pilot protocol and actual-feedback record; student sessions and field validation NOT RUN                                      |

Phases 0–4 are accepted with documented limitations; see PROJECT_CONTEXT.md for dated verification. Phase 4 is committed/pushed as dd6179c with successful hosted quality CI. Pages publication remains manual configuration, not a live deployment. Live HTTPS acceptance, physical-device installation, screen-reader use and native print destinations remain owner release checks in docs/release.md.

Phase 5 preparation is complete under the 2026-10-21 resume authorization; see docs/phase-5-plan.md. The protocol and feedback record are ready, but student sessions/field validation remain NOT RUN. Review release and protocol prerequisites before involving volunteers. No public site, pilot results or institutional approval is claimed. All planned preparation deliverables are now present; future work should address actual acceptance evidence or reported defects under a separate instruction, rather than inventing a Phase 6. Stop after this phase report.
