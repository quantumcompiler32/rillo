# Rillo: current pitfalls and roadmap

Last reviewed: November 1, 2026

## Purpose

Rillo should help a Milpitas Middle College student turn course information from screenshots and photographs into a reviewable plan, understand what they have recorded and what remains uncertain, and identify useful next actions across colleges, degree goals, and transfer destinations. Begin with Moksh's real workflow, then test whether it works for other students.

Rillo provides planning estimates, not official transcript evaluation, registration, credit, degree certification, or admission decisions. A planned course never earns credit merely because it appears in a plan.

## Current state and pitfalls

The current browser-local prototype stores manually entered classes, registration plans, deadlines, degree goals, and transfer notes. It has a weekly calendar, JSON backup, calendar export, and browser alerts while the page is open. Some interface changes are currently uncommitted. These observations are based on a code and documentation review, not a complete hands-on acceptance test.

- **Entry is too manual.** There is no screenshot or paper-photo extraction, bulk review, or reliable duplicate detection. Entering several terms course by course is burdensome.
- **Course information is incomplete.** There is no live catalog or section discovery, validated prerequisites, units-based planning, or current section availability. Free-text college names and terms can cause mismatches.
- **The calendar is descriptive.** It displays recorded meetings but does not identify conflicts, compare schedules, handle every meeting pattern, or verify enrollment and dates.
- **Degree estimates are very limited.** Manually entered course codes are matched as strings. Alternatives, sequences, units, grades, GE, GPA, residency, catalog rights, and official evaluations are not evaluated. The same code at different colleges is not proof of equivalence.
- **Transfer is a notes collection.** Goals and links can be saved, but Rillo does not retrieve or evaluate ASSIST agreements, compare universities, or establish missing courses.
- **The next action is fragmented.** Registration, dates, courses, and degree information are separate, making it hard to tell what to do now.
- **Dates can become stale.** Some published dates are hardcoded for specific colleges and terms; exact applicability, times, and freshness need verification. A general opening date is not a student's assigned appointment.
- **Reminders are limited.** Browser notifications require Rillo to be open. Calendar export is the current closed-app option and needs real-device verification.
- **Data can be lost.** Browser storage is device/browser specific and may be cleared; backup and restore require user action. Import needs robust validation and recovery before replacing existing data.
- **Trust and accessibility need testing.** There is no identified automated test suite; core workflows, mobile, keyboard, screen readers, reduced motion, calendar imports, and error recovery need practical validation.
- **Private information needs careful handling.** Screenshots can contain names, IDs, grades, and schedules. The intended local processing and image deletion behavior are not yet implemented and must not be promised as current behavior.

## Priority workflow: import a course plan from images

The supplied screenshot shows a multi-term plan with enrolled and planned courses, section identifiers, course names, units, term totals, and prerequisite warnings. A paper photograph may have different layouts, handwriting, glare, skew, missing information, or multiple pages. Rillo should accept multiple screenshots and photographs, including HEIC where supported, and let a student build one plan from them.

1. Let the student choose images, identify or confirm the source college and document type, and see how the images will be processed. Support cropping/rotation and accessible manual entry as a fallback.
2. Extract candidate terms, course codes and section numbers, titles, units, status labels, and any visible warnings. Preserve the distinction between a course and a particular section. Extract only what is visible; mark uncertain or unreadable fields rather than guessing.
3. Present an editable review before saving: original image alongside extracted entries, confidence/uncertainty, duplicate candidates, and conflicts with existing records. Permit corrections, omissions, and adding missing courses. Reconcile repeated imports without silently overwriting data.
4. Save only confirmed records. Keep source evidence and student confirmation separate from official verification. A screenshot of enrollment supports a student-reported enrollment record; it does not establish completion, a passing grade, transferable credit, or acceptance toward a requirement. A planned class remains planned. A paper form's interpretation depends on what it actually says.
5. Show a plan by term and status, plus missing information and next steps. Compare it with sourced requirements only when a selected program, college, catalog year, and sufficiently detailed rules are available. If the source or status is missing, say **unknown / review needed**, not completed or unmet with certainty.

**Privacy design:** Prefer on-device extraction, review, and local storage; do not retain original images after review unless the student explicitly chooses to keep them. Explain any external processing and obtain an informed choice before sending images. Provide deletion and backup controls, avoid collecting unnecessary identifiers, and assess device support and extraction quality before selecting an OCR approach. This is a design goal, not a claim that current code already provides it.

**Acceptance examples:** A multi-term screenshot imports each visible course into the correct term; enrolled and planned entries remain distinct; low-confidence text requires review; a repeated upload offers reconciliation; a blurred or handwritten image permits correction; cancellation leaves the existing plan unchanged; no earned credit is inferred from a plan.

The two supplied HEIC files could not be decoded in this review, so their contents have not been independently assessed. Validate the photo workflow against them once they can be opened, without assuming what they contain.

## Requirement and transfer intelligence

### First: a source-backed degree path

Implement one specific degree at one awarding college and catalog year before generalizing. Record official source links, dates checked, requirement groups, alternatives, sequences, units and other conditions where supported. Explain why each item appears recorded complete, in progress, planned, pending external evaluation, missing, or unknown. A completed course is student-reported until supported by the applicable official record; grade and applicability still need review. Cross-college credit remains pending until the awarding college confirms it. Show GE, unit, GPA, residency, catalog rights and other unevaluated areas instead of implying a complete audit.

### Later: ASSIST integration and college comparisons

Let students select a university, major, agreement year, and sending colleges, then retrieve or otherwise use available official agreements to compile requirement groups and corresponding college courses, with links to the exact agreement and its year. Compare these with reviewed course records, showing completed, planned, missing, and unknown evidence separately. Preserve alternatives, combined sequences, footnotes, and gaps; do not equate courses merely because they have similar names or satisfy different agreements. Explain that agreements can vary by institution and year, and that course availability and prerequisites require separate checking.

[ASSIST](https://assist.org/) covers published California community-college articulation with UC, CSU, and participating independent institutions; agreements can be absent or incomplete. It does not provide community-college-to-community-college articulation or out-of-state agreements. See [ASSIST's student guide](https://resource.assist.org/Students-Faculty-Staff) and [FAQ](https://resource.assist.org/FAQ). For unsupported targets, collect official university sources and mark requirements for review. Verify available integration methods, terms of use, data refresh, and access before committing to automated retrieval; direct checking is a future feature, not an existing capability.

## Appropriate links and actionable guidance

Make these accessible in context, with college, purpose, date checked, and applicability clearly identified. Links to forms do not mean they have been submitted or approved. User-provided direct URLs below have not all been independently verified and can change; verify destinations before release.

- [MMCHS outside credit form](https://docs.google.com/forms/d/e/1FAIpQLSeXhjlXBOFqY1hQ519JzbwMyX0MGP3h3goLB7tzajLaPj6t9A/viewform) — user reports this is required for classes outside SJCC; confirm current school policy with MMCHS.
- [Mission unit limitation petition](https://missioncollege.formstack.com/workflows/unit_limitation) — the user uses this for overload requests. [Mission's dual enrollment guidance](https://missioncollege.edu/office-of-instruction/educational-partnerships/dual-enrollment.html) describes term and student-category limits and petitions; verify the student's category and current rules rather than applying a universal eight-unit threshold.
- [Mission Dual Enrollment Form](https://missioncollege.formstack.com/workflows/dual_enrollment_form) — use Mission's own form name and check its current instructions.
- [Foothill high school dual enrollment form](https://fhdaedu.na1.adobesign.com/public/esignWidget?wid=CBFCIBAA3AAABLblqZhCsb4jqouP6mLptbNs6uQGYk0FIk1csozOURxNRlXdiqxhoCbBKyYsghhnvv_O4*) — user-provided direct link; verify the exact address before use. Use [Foothill's official dual enrollment page](https://foothill.edu/high-school/index.html) as a reliable starting point if it fails.
- [SJCC dual enrollment](https://sjcc.edu/students/academic-programs/dual-enrollment.aspx) and [Milpitas concurrent enrollment](https://sjcc.edu/milpitas-extension/milpitas-concurrent-enrollment.aspx) — verify current application and R-40 instructions.
- [ASSIST](https://assist.org/) — official published transfer articulation, subject to the coverage and limitations above.

Surface relevant links when a student chooses a college and term, with a clear explanation of when to check them. Do not automatically submit forms or treat a displayed link as an approved form.

## Delivery order

1. **Protect the basics:** Validate save, edit, delete, migration, backup/restore, calendar export, accessibility, and mobile behavior. Add focused tests and source/date freshness controls.
2. **Import and review images:** Deliver the image workflow above using the real screenshot and paper-photo examples, with manual fallback and privacy safeguards.
3. **Make planning actionable:** Add a dashboard for upcoming personal dates, approval tasks, missing information, schedule conflicts, and relevant official links. Test with a real plan.
4. **Add one verified degree path:** Use a specific official program and catalog year; test nuanced requirements and uncertainty with a counselor.
5. **Add course discovery and schedule comparison:** Research official SJCC and Mission data access and freshness; keep manual entry and source links.
6. **Build transfer comparisons:** Investigate ASSIST integration, then implement a small set of real university/major/college combinations with agreement-level citations and clear unknowns.
7. **Pilot and expand:** Observe a few students and a counselor using the app. Address data quality, accessibility, privacy, and ongoing maintenance before broader rollout. Evaluate sync and background reminders separately; calendar export remains the initial fallback.

## Decisions and validation still needed

- Which degree, awarding college, catalog year, and university/major targets come first?
- What student information can be kept locally, backed up, or optionally synced, and who maintains it?
- Which image formats and devices can process photos locally with acceptable accuracy?
- Which official sources permit reliable automated access, and who checks updates?
- How will a counselor validate requirement logic and students' understanding of uncertainty?
- Do MMCHS, Mission, Foothill, and SJCC policies and form URLs still apply to the specific student's term and circumstances?

Related planning issues: [overall map](https://github.com/quantumcompiler32/rillo/issues/1), [evidence states](https://github.com/quantumcompiler32/rillo/issues/2), [degree comparison](https://github.com/quantumcompiler32/rillo/issues/3), [transfer targets](https://github.com/quantumcompiler32/rillo/issues/4), and [closed-app reminders](https://github.com/quantumcompiler32/rillo/issues/5).
