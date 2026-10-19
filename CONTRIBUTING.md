# Contributing

Read README.md, PROJECT_CONTEXT.md, AGENTS.md and docs/requirements.md before changing code. Discuss a narrowly scoped issue first where useful; do not submit real student records or confidential evidence. No accounts or paid services are needed for development.

1. Fork/clone the repository, install the documented Node/npm versions and run `npm ci`.
2. Create a feature branch. Run `npm run dev` and reproduce the intended behavior with synthetic data.
3. Keep domain rules pure, browser APIs in infrastructure, and components accessible. Add tests matching the risk and scope.
4. Run `npm run format`, `npm run check`, `npm run test:e2e` (install Chromium first) and `npm audit --audit-level=high`.
5. Update relevant requirements/docs and handoff evidence. Open a focused PR describing behavior, checks and limitations.

Never bypass peer-dependency errors, weaken gates, fabricate verification, commit secrets, or mix unapproved future phases into a change. Database changes in Phase 1 onward need an explicit version/migration plan and tests preserving existing records. Reviewers should inspect correctness, errors, security, data consistency, accessibility, dependency licenses and maintainability. Maintainer identity and response timelines have not been established.
