# Confirmed-plan persistence

Ticket #7 protects existing browser-local workflows. It does not implement the later screenshot, section-option, authorization, or meeting/task editors from specification #6.

## Commit and recovery contract

`plan-store.js` is the cohesive persistence boundary: decode/migrate/validate a supported plan, load it, or commit a validated candidate. It uses a classic script so opening `index.html` directly still works. No build, backend, account, or network service is needed for student data.

The UI constructs a candidate without mutating its currently displayed plan. The boundary validates the entire candidate and makes one atomic localStorage write. Only after that succeeds does the UI publish the candidate and report success. A failed add, edit, delete, or restore retains the previous displayed/stored plan. Form errors retain the edits and receive focus for correction/retry.

Loading never writes, clears, or repairs stored data automatically. A corrupt or inaccessible newest plan displays a persistent recovery error, retains any valid plan already displayed, and prevents ordinary writes and misleading empty exports. Use **Retry saved plan** after correcting browser access, or explicitly replace the data by importing a valid backup. Across a reload, corrupt data cannot reconstruct a previous valid display; the recovery notice remains visible instead of claiming the empty view is a saved plan.

## Versions and identity

New saves/backups use explicit version 3 and the `rillo-plan-v3` key. Existing collections remain `classes`, `registrations`, `deadlines`, `degrees`, and `transfers`. Every record has a nonempty string ID unique within its collection; edits preserve identity and existing fields not exposed by that editor. Classes in different colleges, terms, or attempts are never deduplicated by course code.

Version 1 and 2 backups migrate in memory. Historical on-device versionless data is accepted only at its known v1/v2 key. The newest present key wins; invalid newer data does not silently fall back to stale legacy data. Original legacy keys remain untouched. The first successful edit/restore saves v3; repeated reloads do not re-migrate or duplicate its records.

Preserve legacy `r40`, free-text `days`/`time`, notes, exact section identifiers including leading zeros, statuses, goals, and deadlines. Missing structured meeting days become an empty list, not an inferred schedule. Legacy form text retains its recorded meaning: no course/section coverage, readiness, eligibility, or enrollment links are invented. Where both `degrees` and `legacyDegrees` exist, current records win for the same ID and additional unique legacy goals survive.

## Validation and future relationships

Validate collection and record shapes, required fields, enum values, real dates (including leap years), minute-precision local times, units, identifier types, and duplicate IDs before accepting data. Optional text remains optional. Unknown fields/collections are rejected rather than silently discarded or persisted; this also prevents unknown dangling relationships and source-image artifacts from being smuggled into backups.

The current schema has no foreign keys: course/term context remains on each existing class/registration/deadline. Later tickets can use these stable class IDs as planned-class references and introduce explicit course, section-option, authorization, meeting-pattern, and task relationships at their own feature boundary. Such a change must add an explicit version/migration, field rules, foreign-key checks (including delete behavior), and browser backup/restore tests before any new relationship can commit. Do not add speculative empty collections now or infer legacy associations.

Student confirmation is not college verification. Planned classes award no credit. Existing degree estimates and transfer limitations remain unchanged.

## Browser checks

Install dependencies with `npm ci`, then `npx playwright install chromium`. Run `npm test` for the laptop and narrow phone-viewport projects; the phone project also enables reduced motion. `npm run check` performs JavaScript syntax checks; this plain JavaScript repository has no TypeScript typecheck.

The public UI, reload, JSON backup/restore, and calendar download are the assertion boundaries. Historical storage is seeded only as load input; browser Storage methods are overridden only to inject read/write failures. Tests do not inspect private storage layout to assert success and do not substitute application collaborators. No OCR is involved.

These checks use Chromium desktop and emulated phone dimensions, not physical-phone or screen-reader certification. Calendar checks inspect downloaded deadline events, timestamps, escaping, and reminders; real calendar-app import validation remains the release-gate ticket #16.
