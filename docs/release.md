# Release candidate and publication

Phase 4 prepares a release candidate. This is not a claim of a completed physical-device, screen-reader, institutional or real-student pilot. See PROJECT_CONTEXT.md for dated checks and unresolved acceptance work. Keep records synthetic until the owner accepts the intended devices and recovery workflow.

## Local verification

Use the documented Node/npm versions, then run:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run check
npm run test:e2e
npm audit --audit-level=high
```

Linux CI installs browser system dependencies with `npx playwright install --with-deps chromium firefox webkit`. Browser tests use separate fresh contexts and synthetic records. Firefox and WebKit engine checks supplement Chromium; they do not establish behavior on physical iOS Safari/Android devices. PDF generation uses Chromium's supported API; print-media behavior is checked in every engine.

Builds enforce a 100 KiB aggregate gzip JavaScript budget and 160 KiB gzip total static-asset budget. These are regression guardrails, not network/device performance guarantees. The distribution allowlist excludes tests, source fixtures, symlinks and unexpected public files. Review an intentional asset/budget change rather than bypassing that check. Keep real records and backups outside the repository and public directory.

The work-log list shows 50 records per page; all records still contribute to summaries, backups and printed reports. Native print events synchronously prepare the saved report; ordinary work does not render the hidden full logbook. Capacity tests measure 1,000/10,000 synthetic entries under 4x CPU throttling and verify exact export contents. Throttling is not a substitute for a low-end physical device. Explicitly previewing/printing very large logbooks can still be expensive.

Raster install assets are committed alongside the existing SVG. To regenerate them from that mark, install Playwright Chromium and run `node scripts/build-icons.mjs`. No font, external image service or new runtime package is used. Manifest icons include 192/512 PNG and a separate full-background maskable PNG; Apple touch icon is 180 PNG. Actual browser install menus/prompts vary. Do not claim installation based only on a valid manifest.

## GitHub Pages configuration

`.github/workflows/pages.yml` is manual-only and guarded to `main`. It installs from the lockfile, runs all quality/audit/browser gates, builds relative-path assets and uploads only `dist`. Actions are pinned to verified official tag commits. The build job has contents/pages read access; only the deployment job has pages/id-token write access. No personal token is required or embedded. Pages enablement is explicitly disabled in the action; owner setup is required.

This follows the [official custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Prepare publication as follows:

1. Review the committed candidate, successful hosted quality run and limitations. A commit/push or workflow change alone does not publish this site.
2. In repository Settings -> Pages, choose GitHub Actions as the publishing source. Review the `github-pages` environment's deployment protections and restrict publication to the intended branch.
3. When publication is intended, run **Publish GitHub Pages** from Actions on `main`. Inspect the verified build and deployment results; use the action's actual environment URL, rather than assuming deployment succeeded.
4. On that HTTPS address, check the repository subpath, fresh synthetic setup/save/reload, downloaded backup/restore, PDF preview and offline reopening after readiness. Each browser/profile/origin has separate records: development data is not moved to the deployed address.
5. Test the intended phone's install/home-screen flow, offline relaunch, native date/number input and backup file access. Verify screen-reader labels/errors/modal focus and 200% text/reflow on the actual device. Verify a recovery copy outside browser storage before real records.

No Pages setting, public deployment or live-site acceptance is performed merely by adding this workflow. Hosted behavior and permissions must be verified when the owner publishes. Do not use a deployment token or change settings to conceal a failed gate. Ordinary hosting requests reach GitHub; application records stay local unless the user chooses to share exported files or follows an evidence link.

## Updates and recovery

New workers wait while old application tabs remain open; do not force activation into open drafts. Export current records, close all tabs/windows using the app (including installed windows), reconnect and reopen to adopt an update. Records remain in IndexedDB at the same browser profile/origin; build cache replacement does not migrate or reset them. If offline preparation fails, reconnect and reload; do not clear site data as a troubleshooting shortcut.

Rollback publication changes the static app version; it is not a backup/restore mechanism. Preserve JSON backups and ensure any rollback can read the current schema. Do not roll back across an incompatible future data version without a preserving migration/recovery plan. No legacy schema migration or corrupt-database reset is currently provided.

GitHub Pages static hosting does not provide this app's response-header configuration. The meta CSP restricts same-origin scripts/styles/images/connections, workers and manifests, and disables objects/base changes/form submissions. Injected inline CSS and local WebSocket access are permitted only by the development server. A meta policy cannot provide `frame-ancestors`; hosting/frame protection is a recorded limitation rather than a security certification. Local storage and exported reports/backups are unencrypted and can be lost or accessed by device users/extensions or compromised same-origin code.

Phase 5 [pilot preparation](pilot-protocol.md) is complete; [student-session results](pilot-feedback.md) remain NOT RUN. Review the protocol preflight before sessions and record only actual feedback. Do not infer student validation from technical checks or the owner's maintenance acceptance. Technical release readiness and actual field validation remain separate; an unavailable pilot does not indefinitely block an otherwise accepted release.
