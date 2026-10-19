# Requirements and acceptance criteria

## Product boundary

InternLog PK will help computing students in Pakistan organize authentic internship records. It is independent of HEC and universities; local rules vary. No approvals, certifications, signatures, attendance, or academic credit are generated or guaranteed. No accounts, server data storage, analytics, paid services, AI services, or university-specific templates belong in the MVP.

## Phase 0 acceptance (reviewed and accepted with limitations)

- A clean clone installs with `npm ci` on documented Node/npm versions.
- A strict TypeScript React shell runs through Vite and builds for static hosting, including repository subpaths.
- The page identifies the development stage and does not expose nonfunctional record controls.
- Semantic landmarks, a working keyboard skip link, visible focus, responsive layout, and reduced-motion support exist.
- Production manifest and service worker provide offline reopening after successful caching; development does not register a worker. Only explicit build assets are cached.
- Vitest/Testing Library exercise the shell and offline setup; Playwright exercises keyboard access, responsive overflow, and offline reopening.
- CI enforces type checking, lint, formatting, coverage, production build, high-severity dependency audit, and browser tests.
- Architecture, data invariants, threats, contribution workflow, license, and continuity instructions are documented. Unsupported or unexecuted checks are explicit.

## Approved later capabilities

| Requirement           | Acceptance boundary                                                                                                                         | Phase                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| F1 Profile            | Create/edit student, institution, program, host, optional supervisor, start/end dates, configurable target                                  | 1 model; 2 UI           |
| F2 Work log           | Create/read/edit/delete date, description, integer duration, learning outcomes, optional safe reference URL; confirm deletion               | 1 model; 2 UI           |
| F3 Progress           | Derive recorded/required/remaining minutes, percentage, weekly totals and distinct workdays from persisted records; mark incomplete profile | 1 domain; 2 UI          |
| F4 Report             | Accurate persisted activities grouped by Monday week, daily/weekly totals, genuine review/signature spaces, browser print/PDF               | 3                       |
| F5 Persistence/backup | Versioned IndexedDB, atomic updates, explicit failures, strict bounded JSON validation, confirmed replacement and export                    | 1 persistence; 3 backup |

## Phase 1 acceptance and implemented domain contract

See [Phase 1 acceptance plan](phase-1-plan.md) and [storage decision](decisions/0002-validated-atomic-dataset.md). A missing profile is represented by `null`, allowed only with an empty entry list; stored partial profiles are not accepted. Dates support years 0001–9999. Runtime inputs must already be trimmed; forms trim user text before validation. Limits count JavaScript UTF-16 code units; the serialized dataset additionally has a 5 MiB UTF-8 ceiling.

Profile: studentName, institution, program, organization (trimmed 1–160 characters), supervisor (0–160, empty string when absent), startDate and endDate (`YYYY-MM-DD`, real calendar dates, end >= start), requiredMinutes (integer 1–600,000). An editable 150-hour example is not a universal requirement.

Entry: lowercase UUID id (versions 1–8 and standard variant), date (real date-only string inside profile dates), description (1–4,000 characters), learningOutcomes (1–2,000), durationMinutes (integer 1–1,440), referenceUrl (optional absolute HTTP/HTTPS URL, <=2,048 characters, no credentials or whitespace). The aggregate of entries on any date must not exceed 1,440 minutes. At most 10,000 entries. Reject unknown fields, missing required fields and duplicate IDs; accept similar-looking distinct work. Phase 2 may warn about duplicate-looking records. Reject profile date changes that exclude existing entries until resolved explicitly.

Use integer minutes for all arithmetic, render hours/minutes only at boundaries. Group by ISO Monday–Sunday weeks, labeled with their Monday date; never parse a date-only string through local timezone conversion. Remaining minutes floor at zero; display percentage capped at 100 with any excess minutes separately visible. Distinct date count is workdays, not verified attendance.

Internal serialization is `{ format: 'internlog-pk-data', version: 1, data: { profile, entries } }`, bounded to 5 MiB UTF-8 and validated on encode/decode. It is not a user backup API. Proposed Phase 3 backup envelope: `{ format: 'internlog-pk', version: 1, profile, entries }`; maximum 5 MiB UTF-8 and 10,000 entries. Reject unknown versions, unexpected fields, duplicate IDs, invalid values and totals before any write. Replacement must use one transaction, explicit confirmation and an opportunity to export existing data. Database, internal payload and backup versions evolve independently.

## Phase 2 workflows

See [Phase 2 acceptance plan](phase-2-plan.md). F1–F3 now have student-facing forms and saved-data views. Targets use configurable hours plus 0–59 additional minutes; 150 hours is only the new-profile example. Entry duration uses whole hours/minutes and the existing per-day cap. New entry date defaults to the browser's local calendar date when within the internship, otherwise the start date; users can change it. Optional supervisor is stored as an empty string and an empty evidence field is omitted.

Profile edits cannot exclude existing work. Similar date/description/duration with a distinct ID warns, then permits Save distinct entry. Delete requires explicit modal confirmation; dirty cancellation and page unloading have warning protections. Storage failures retain drafts and never show committed-success messages. Conflict refresh retains editors and requires explicit resubmission; deleted IDs cannot be resurrected through edit. Remaining/required time is Not set until a complete profile exists. Percentage display truncates to one decimal, while the underlying domain percentage and remaining/excess minutes stay exact. Weekly totals are summaries, not printable reports or verified attendance. Reports/backup controls remain out of Phase 2 scope.
