# Rillo next release: design decisions

Status: interview decisions synthesized into [specification issue #6](https://github.com/quantumcompiler32/rillo/issues/6), labeled ready-for-agent. Local spec: [reviewed screenshot import, section planning, and registration calendar](rillo-import-registration-spec.md). This document retains the interview decisions; the GitHub issue is the implementation specification.

## Confirmed direction

Confirmed by Moksh on November 1, 2026:

- The first priority is importing courses from screenshots or photographs with less manual entry. Actionable registration guidance follows using reviewed course records.
- Design for Moksh's real workflow first, then validate with a small MMCHS student pilot.
- Keep image processing on-device for the first release, with manual correction as the fallback. If extraction quality is inadequate, revisit the processing trade-off explicitly before adding external processing.
- Registration, degree, and transfer planning remain in the broader product vision. This release narrows the immediate work rather than removing those goals.

## Validation still required

- Mission form approval granularity (not established by readable public form fields).
- Device/browser extraction feasibility and hands-on acceptance results (implementation validation still required).

## Confirmed import experience

Confirmed by Moksh on November 1, 2026:

- Begin with clear portal screenshots. Printed photographs follow; handwriting is deferred until extraction quality can be assessed. Manual entry remains available.
- Show an editable table alongside the source image with a batch confirmation. Unreadable or uncertain fields require correction or an explicit unknown; a missing status never defaults to completed.
- Repeated imports propose additions and highlight differences in existing courses. The student selects changes; existing records are never silently overwritten.
- Discard Rillo's copies of source images after saving or cancelling review. Retain a brief source note with confirmed records, without retaining the image. This does not delete the student's original file.
- After saving, show the plan grouped by term, with course statuses, missing information, and a short next-action list.

## Confirmed batch, device, and recovery scope

Confirmed by Moksh on November 1, 2026:

- Accept multiple screenshots in one batch, including overlapping images, for one college and multiple terms. Review together and flag possible duplicates within the batch and against existing records.
- Target both phone and laptop import. Use an image/review switch on phones and a side-by-side view on laptops. Actual on-device extraction support must be tested before it is promised.
- On extraction failure, preserve candidates already obtained in the current review and offer manual correction.
- Cancellation discards the unsaved batch, warns if edits were made, and leaves the existing saved plan unchanged. Persisting unfinished reviews across sessions is deferred.
- Evaluate with Moksh's real multi-term plan: import plus correction is faster than manual entry; saved entries reflect confirmed college, term, and status; repeat imports avoid accidental duplicates; backup/restore preserves the result.

## Confirmed missing-information rule

Require student-confirmed college, term, course code, and course status before saving an entry. Missing required information must be entered and confirmed; incomplete entries stay in review while ready entries can be saved. Section and instructor can be explicitly marked not selected yet, and other missing details require acknowledgment. Student confirmation permits saving to the student's plan; use student-confirmed rather than approved for import review. Official college verification remains separate. A planned course never establishes earned credit.

## Course planning and section choices

Confirmed by Moksh on November 1, 2026:

- Distinguish future planned courses from particular sections with known registration identifiers, instructors, and meeting times.
- Allow the student to record exact section/registration identifiers and track status while preparing forms and registering.
- Let the student see alternative professors and meeting times while comparing section options.
- Help the student distinguish form submissions, enrollment eligibility, and registration choices. These are student tracking records, not automatic official determinations.

Use each college's actual form and identifier labels; support both section numbers and registration identifiers. The user's earlier R44/CRM wording does not by itself establish those as official labels. Approval granularity must follow the applicable form and cannot be assumed to be section-specific.

## Confirmed section workflow and immediate scope

Confirmed by Moksh on November 1, 2026:

- Include manual section options, comparison, and form/registration tracking in the next release alongside screenshot import. Automatic section discovery is deferred.
- Keep form progress (preparing, submitted, correction needed, approval reported), enrollment readiness (not checked, clearance needed, student-reported cleared), and registration progress (considering, waitlisted, registered, in progress, no longer considering) separate. Submission never automatically establishes eligibility or registration. Preferred/backup is an independent preference, not a registration state.
- Compare instructor, meeting times, conflicts, location, and recorded readiness. The student chooses preferred and backup options; Rillo does not automatically declare a best section. Missing information remains visible.
- Account for timing in the workflow and show when and where a class meets on the calendar, following the confirmed calendar rules below.

Preferred/backup choices are independent of form progress, readiness, and registration status. A preferred section can also be waitlisted, registered, or awaiting clearance.

## Confirmed calendar behavior

Confirmed by Moksh on November 1, 2026:

- Show registered and in-progress sections by default. A planning view overlays preferred and backup options with distinct labels; considering an option does not imply enrollment.
- Support multiple meeting patterns per section, each with days, start/end times, date range, and location or online format. Lecture and lab can appear separately.
- Keep asynchronous and unknown-time sections in an unscheduled list; never invent meeting times.
- Show class meetings and tasks/deadlines with separate labels and filters. Link form targets, personal registration appointments, and deadlines to their college, term, and relevant course or section.
- Passing a date never automatically changes approval or enrollment status.
- Warn about conflicts without blocking saving section options. A time conflict requires overlapping meeting date ranges as well as overlapping days/times; missing dates or times show cannot fully check conflicts. Automatic travel-time estimates are deferred.

## Confirmed changes after form submission

Preserve the recorded submission and its actual course/term or section scope when the student changes section preference. Keep the new section's readiness separate and flag that the student must check whether the authorization covers the new choice. Do not automatically copy enrollment or clearance.

## Deferred work

- Printed-photo extraction follows the screenshot release; handwriting awaits extraction-quality assessment.
- Automatic section discovery, external image processing, saved unfinished review sessions, and automatic travel-time estimates are outside this release.
- Expanded degree/transfer evaluation, sync, and background push reminders remain in the broader roadmap rather than this release.

## Official-source findings: form scope

Checked November 1, 2026:

- SJCC's public Milpitas concurrent-enrollment page links an R-40 PDF marked Rev. 03/2020. Its approved-courses table lists courses and term/year; extracted fields do not identify sections or CRNs. Represent this course authorization separately from a selected section, without inferring eligibility for every alternative section.
- SJCC describes R-40 processing, prerequisite clearance, and registration as separate steps.
- Mission calls its form the Dual Enrollment Form; public instructions distinguish form processing, prerequisite clearance, and registration. Exact course-versus-section scope remains unverified because the linked form fields were not readable in the lookup.
- Reviewed official sources use R-40. The user's earlier R44/CRM wording remains unconfirmed and should not become an official product label.

Sources: [SJCC R-40 PDF](https://sjcc.edu/_resources/PDF/admisssion_and_records/R40.3.30.20.pdf), [SJCC Milpitas concurrent enrollment](https://sjcc.edu/milpitas-extension/milpitas-concurrent-enrollment.aspx), [Mission dual enrollment](https://missioncollege.edu/office-of-instruction/educational-partnerships/dual-enrollment.html).

Related: [product roadmap](rillo-product-roadmap.md) and [overall decision map](https://github.com/quantumcompiler32/rillo/issues/1).
