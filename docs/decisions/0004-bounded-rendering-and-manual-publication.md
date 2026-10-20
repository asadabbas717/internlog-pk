# ADR 0004: Bounded ordinary rendering and manual publication

Status: accepted for Phase 4, 2026-10-21.

A 1,000-record synthetic Chromium check under 4x CPU throttling created 18,196 DOM elements, including 1,005 unopened report rows. Bound ordinary work-log rendering to 50 cards, memoize ordering and expose accessible previous/next controls. Keep all stored records in summaries and backups. Avoid a virtualization library or data/schema rewrite.

Render the full report only for explicit preview or printing. Native `beforeprint` uses React DOM `flushSync` to provide committed data before capture, and `afterprint` removes the temporary report. This follows the [React browser-print integration guidance](https://react.dev/reference/react-dom/flushSync#flushing-updates-for-third-party-integrations). This narrow synchronous browser boundary preserves native Ctrl+P without paying the full report DOM cost during every ordinary save. Large explicit reports remain potentially expensive.

Prepare GitHub Pages through a manual-only workflow, after the same quality/security/browser gates. Use immutable official action commits, a main-branch guard, read-only build permissions and isolated Pages/OIDC deployment permissions. Do not publish on push or change Pages settings automatically. Follow [GitHub's Pages workflow contract](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages); owner publication and live HTTPS acceptance remain explicit later actions. No new runtime dependency or database change is required.
