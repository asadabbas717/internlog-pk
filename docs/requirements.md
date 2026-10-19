# Requirements and acceptance criteria

## Product boundary

InternLog PK will help computing students in Pakistan organize authentic internship records. It is independent of HEC and universities; local rules vary. No approvals, certifications, signatures, attendance, or academic credit are generated or guaranteed. No accounts, server data storage, analytics, paid services, AI services, or university-specific templates belong in the MVP.

## Phase 0 acceptance (current scope)

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

## Proposed domain contract (not implemented)

Profile: studentName, institution, program, organization (trimmed 1–160 characters), supervisor (0–160), startDate and endDate (`YYYY-MM-DD`, real calendar dates, end >= start), requiredMinutes (integer 1–600,000). An editable 150-hour example is not a universal requirement.

Entry: UUID id, date (real date-only string inside profile dates), description (1–4,000 characters), learningOutcomes (1–2,000), durationMinutes (integer 1–1,440), referenceUrl (optional absolute HTTP/HTTPS URL, <=2,048 characters, no embedded credentials). The aggregate of entries on any date must not exceed 1,440 minutes. Warn about duplicate-looking records without rejecting distinct work. Reject profile date changes that exclude existing entries until resolved explicitly.

Use integer minutes for all arithmetic, render hours/minutes only at boundaries. Group by ISO Monday–Sunday weeks, labeled with their Monday date; never parse a date-only string through local timezone conversion. Remaining minutes floor at zero; display percentage capped at 100 with any excess minutes separately visible. Distinct date count is workdays, not verified attendance.

Future backup envelope: `{ format: 'internlog-pk', version: 1, profile, entries }`; maximum 5 MiB UTF-8 and 10,000 entries. Reject unknown schema versions, unexpected fields, duplicate IDs, invalid values and totals before any write. Use one transaction for replacement, with explicit confirmation and opportunity to export existing data. Database and backup versions evolve independently. Phase 1 must review these proposed bounds and add positive, negative, calendar, precision, daily-limit and failure tests before implementation.
