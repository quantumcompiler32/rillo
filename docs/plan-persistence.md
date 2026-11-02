# Confirmed-plan persistence

Ticket #7 protects existing browser-local workflows; #8 adds linked section options. Screenshot, authorization, and meeting/task editors remain later work from specification #6.

## Commit and recovery contract

`plan-store.js` is the cohesive persistence boundary: decode/migrate/validate a supported plan, load it, or commit a validated candidate. It uses a classic script so opening `index.html` directly still works. No build, backend, account, or network service is needed for student data.

The UI constructs a candidate without mutating its currently displayed plan. The boundary validates the entire candidate and makes one atomic localStorage write. Only after that succeeds does the UI publish the candidate and report success. A failed add, edit, delete, or restore retains the previous displayed/stored plan. Form errors retain the edits and receive focus for correction/retry.

Loading never writes, clears, or repairs stored data automatically. A corrupt or inaccessible newest plan displays a persistent recovery error, retains any valid plan already displayed, and prevents ordinary writes and misleading empty exports. Use **Retry saved plan** after correcting browser access, or explicitly replace the data by importing a valid backup. Across a reload, corrupt data cannot reconstruct a previous valid display; the recovery notice remains visible instead of claiming the empty view is a saved plan.

## Versions and identity

New saves/backups use explicit version 4 and the `rillo-plan-v4` key. Collections are `classes`, `registrations`, `deadlines`, `degrees`, `transfers`, and `sectionOptions`. Every record has a nonempty string ID unique within its collection; edits preserve identity and existing fields not exposed by that editor. Classes in different colleges, terms, or attempts are never deduplicated by course code.

Version 1, 2, and 3 backups migrate in memory. Historical on-device versionless data is accepted only at its known v1/v2 key. The newest present key wins; invalid newer data does not silently fall back to stale legacy data. Original legacy keys remain untouched. The first successful edit/restore saves v4; repeated reloads do not re-migrate or duplicate its records.

Preserve legacy `r40`, free-text `days`/`time`, notes, exact section identifiers including leading zeros, statuses, goals, and deadlines. Missing structured meeting days become an empty list, not an inferred schedule. Legacy form text retains its recorded meaning: no course/section coverage, readiness, eligibility, or enrollment links are invented. Where `degrees` is present it remains authoritative, including an empty list, so stale `legacyDegrees` copies cannot resurrect intentionally removed goals. Use `legacyDegrees` only when the current list is absent.

## Validation and future relationships

Validate collection and record shapes, required fields, enum values, real dates (including leap years), minute-precision local times, units, identifier types, and duplicate IDs before accepting data. Optional text remains optional. Unknown fields/collections are rejected rather than silently discarded or persisted; this also prevents unknown dangling relationships and source-image artifacts from being smuggled into backups.

A class record has stable identity for a college-owned course in a term/attempt. The new `sectionOptions` collection links each option to a class with `plannedClassId`; missing references are rejected. The linked class owns the course code, college, and term. Options store exact text section/registration identifiers, optional instructor/notes, preference (`None`, `Preferred`, `Backup`), and independent registration status. At most one preferred option exists per class. Changing preference only clears the former preference, never its status. Empty/absent optional values mean unknown; they do not imply clearance or enrollment.

Version 3 migrates with an empty option list and no changes to existing records. Versions 1/2 retain their existing conservative migration. Legacy class-level section/status/schedule fields stay intact; no alternative option or association is invented. The original v1/v2/v3 storage keys remain untouched; newest-present-key validation still gates recovery.

Deleting a class with linked options is blocked. Reassigning its course/college/term is blocked until those options are removed; add a distinct class for another course or attempt. Only considering/no-longer-considering options may be removed, after confirmation. Waitlisted, registered, in-progress, completed, and withdrawn options are retained; students can edit reported status, but removal never cascades through history. Failed option edits/deletes and preference changes use the same atomic commit as other workflows.

Authorization, meeting-pattern, and task relationships belong to later tickets, with explicit version/migration, field validation, reference-safe deletion, and browser backup/restore checks required at each extension.

Student confirmation is not college verification. Planned classes award no credit. Existing degree estimates and transfer limitations remain unchanged.

## Browser checks

Install dependencies with `npm ci`, then `npx playwright install chromium`. Run `npm test` for the laptop and narrow phone-viewport projects; the phone project also enables reduced motion. `npm run check` performs JavaScript syntax checks; this plain JavaScript repository has no TypeScript typecheck.

The public UI, reload, JSON backup/restore, and calendar download are the assertion boundaries. Historical storage is seeded only as load input; browser Storage methods are overridden only to inject read/write failures. Tests do not inspect private storage layout to assert success and do not substitute application collaborators. No OCR is involved.

These checks use Chromium desktop and emulated phone dimensions, not physical-phone or screen-reader certification. Calendar checks inspect downloaded deadline events, timestamps, escaping, and reminders; real calendar-app import validation remains the release-gate ticket #16.
