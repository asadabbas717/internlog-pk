# ADR 0003: Portable backups and saved-snapshot print reports

Status: accepted for Phase 3, 2026-10-20.

Use a separate portable JSON contract `{ format: 'internlog-pk', version: 1, profile, entries }`. Database and internal payload versions stay unchanged. A 5 MiB UTF-8/file byte bound, strict envelope/domain validation and internal storage-size validation run before offering replacement. Never execute backup content or silently repair it. No dependency or remote processing is necessary.

Use whole-logbook replacement through the existing atomic revision-checked save. Show candidate/current identity and counts, offer current export and require explicit modal acknowledgement covering saved records and open drafts. Inspection writes nothing. Retain candidate/current data on failure. After conflict, require explicit refresh and a new review against the new revision before confirmation; never automatically reapply a replacement to unseen records. Corrupt local data remains preserved with an error, rather than allowing import to bypass the corruption guard.

Export a Blob with a fixed filename and release its object URL after the browser has had time to consume it. Requesting download cannot establish that a durable copy exists; users must verify saved files and protect their unencrypted contents. The service worker caches only build assets.

Render report HTML directly from the committed snapshot and existing domain summaries using React text elements. Print CSS suppresses controls and presents a neutral logbook with profile/dates, daily activities, exact totals and genuinely blank review spaces. Keep it available for native print as well as a button; no PDF library, generated signatures, fabricated work or official template. Browser print destinations, fonts and pagination remain platform-dependent acceptance work.
