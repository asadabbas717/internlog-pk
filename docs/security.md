# Security and data-loss considerations

No student records are accepted in Phase 0. Production sends no application analytics and loads no remote resources. The hosting provider still receives ordinary HTTP requests. No server storage or authentication is planned. Device users, browser extensions, malicious scripts on the same origin, and compromised devices are outside the protection of IndexedDB; it is not encrypted storage.

| Threat                                    | Design response                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| User content injection                    | React text rendering; no unsafe HTML; validate future evidence URLs, never execute backup content |
| Malformed / oversized backups             | Future 5 MiB bound, strict envelope/value/aggregate checks, reject before any transaction         |
| Accidental replacement or deletion        | Future confirmation and export/recovery opportunity; transaction rollback on failure              |
| Browser eviction, clearing or device loss | Explicit honest messaging; Phase 3 portable backups                                               |
| Worker cache leakage                      | Only build-time asset allowlist, exact URL matching, scope-specific revision cleanup              |
| Stale worker / mixed versions             | No skipWaiting; new revision activates after old tabs close                                       |
| Dependency compromise                     | Lockfile, npm audit high gate, review license/dependency changes                                  |
| Concurrent edits and upgrades             | Phase 1 must define transaction consistency, blocked upgrades and visible conflict behavior       |

The HTML CSP restricts resources to the same origin, disables objects, base changes and form submissions; local WebSocket access supports Vite development. Static hosting headers (including frame-ancestors) cannot be set through meta tags and remain a deployment consideration. Treat hosting the app beside untrusted same-origin content as unsafe. No secrets or real records in issues, logs or test artifacts. Future exports must safely escape document content; no CSV is approved in the MVP.

See root SECURITY.md for reporting. This foundation is not a security certification or a complete WCAG audit.
