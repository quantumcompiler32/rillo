# Issue #7: safe save, migration, and backup/restore

Validated 2026-11-02 against starting commit `2360ac3` on `quant/safe-plan-persistence`.

## Behavior and scope

Versioned validation and atomic confirmed-plan writes now protect manual add/edit/delete and backup replacement. Forms retain failed edits for retry; invalid imports and failed writes preserve the previous stored/displayed plan. Corrupt/inaccessible storage produces a persistent recovery notice, blocks accidental empty overwrites, and supports retry or explicit valid-backup recovery.

Legacy v1/v2 plans preserve statuses, exact identifiers, notes, degree/transfer goals, and existing registration/date behavior. A present current degree list remains authoritative over stale legacy copies. Unknown fields/relationships are rejected rather than silently dropped. Future feature schemas and reference checks remain scoped to their own tickets; see the persistence contract.

## Acceptance evidence

- `npm test`: **60 passed (1.2m)** — 30 scenarios in both laptop (1280×900) and phone (390×844, touch/mobile emulation, reduced motion) projects, Chromium 145.0.7632.6.
- `npm run check`: passed JavaScript syntax checks. This repository does not have a TypeScript typecheck.
- `git diff --check`: passed.
- Browser tests cover manual creation/edit/deletion, failed save/delete/replace, invalid JSON, unsupported versions, malformed records, required fields, dates/times, enum values, identifier types/duplicates, unknown/dangling relationships, source artifacts, legacy on-device loading and backup migration, reload stability, authoritative goal deletion, cancellation, corrupt-newest-key handling, read-failure retry, and backup round trips.
- Existing degree/transfer views and manual registration/deadline editors pass. Calendar downloads preserve event meaning, timestamps, escaping, and reminder triggers in the regression scenario.
- Direct `file://` opening, save, reload, and backup pass in both viewport projects; no server is needed for normal use.
- Failed-save screenshots were visually inspected at both viewport sizes. Persistent errors receive focus, remain readable, and keep the edited form available. Tests exercise keyboard submission, labeled controls, error focus, and recovery.

Initial browser tests reproduced missing failed-save recovery and insufficient backup validation before their fixes. The review regression reproduced stale legacy goals reappearing before the migration correction. Earlier infrastructure-only browser-launch timeouts and static-server initialization failures were not counted as app acceptance passes; the final complete run passed without retries using one worker and a local server with sufficient request backlog.

No OCR, physical phone, screen-reader session, or real calendar-app import was tested. These are not claimed by this ticket; full real-device/release validation remains ticket #16. All automated fixtures are synthetic. No private student records were used.

## Standards review

No documented-standard violations or actionable baseline smells found. The reviewer checked the persistence boundary, domain terms, test seams, scope, and standards against the starting commit and implementation. Existing compact formatting was retained without unrelated cleanup.

## Spec review

Two P2 findings were corrected before the final commit:

1. Merging stale `legacyDegrees` into a present current list could resurrect intentionally deleted goals. Current `degrees`, including an empty list, is now authoritative; browser regression passed.
2. Nullish migration defaults silently accepted invalid null fields. Defaults now apply only to absent fields; null name/meeting-day inputs fail without replacing the plan. Browser regressions passed.

The spec reviewer independently rechecked both fixes. **Unresolved findings: Standards 0; Spec 0.**
