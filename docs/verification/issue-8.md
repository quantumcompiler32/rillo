# Issue #8: planned classes and section options

Implemented on 2026-11-02 on `quant/safe-plan-persistence`, against clean starting commit `eb8540f`.

## Dependency and scope

Ticket #8 is the earliest open implementation ticket belonging to specification #6. Its native and body dependency is #7, closed with acceptance evidence. The required local commits `c47a211`, `b23acea`, and `eb8540f` are ancestors of this implementation. Parent #6 has no comments; #8 had no comments at selection. Read the parent, child, blocker evidence, AGENTS.md, CONTEXT.md, agent guidance, and persistence contract. No ADRs are present. Parent #6 stays open and unchanged.

Only manual planned-class/section-option entry is delivered. No OCR adapter, extraction substitute, image import, form scope/readiness, option meetings, comparison, or conflict checking is introduced.

## Acceptance evidence

- `npm test`: **78 passed (2.5m)** — 39 scenarios in both laptop and phone projects, no retries.
- `npm run check`: passed JavaScript syntax checks; no TypeScript configuration exists.
- `git diff --check`: passed.

Browser runtime: Chrome for Testing 145.0.7632.6, Playwright 1.58.2; laptop 1280×900 and phone 390×844 with touch/mobile emulation and reduced motion.

The browser workflow is the agreed testing boundary. The real forms, validation, commit, rendering, reload, export, and restore are exercised; storage overrides inject failures only. Public JSON backups provide persistence observations. Fixtures contain synthetic data only.

- Sectionless future class: code, college, and term save without title, units, section, or instructor. Unknowns are labeled; the planned class does not establish enrollment or credit.
- Options: exact section and registration text (`00042`, `000123-A`), instructor, and notes persist. Preferred/waitlisted and backup/considering remain independent through save/reload/restore. A new preferred choice clears the former preference without changing any registration status or the class record. Edits retain IDs and placement.
- Identity: separate class IDs preserve attempts, terms, and colleges even with identical course codes. Options link to a stable class ID and inherit its college/course/term context. Context reassignment and class deletion are blocked while options exist.
- Removal: considering/no-longer-considering options can be removed after confirmation; waitlisted, registered, in-progress, completed, and withdrawn records are retained. Failed or cancelled removal preserves the plan. No cascade deletes history or unrelated records.
- Recovery: failed option edits retain input and focus the associated error; retry succeeds. Invalid option references, enum values, numeric identifiers, duplicate IDs, multiple preferred options, and missing linked classes cannot replace the plan. All reported status choices and unknown option details are exercised.
- Migration: versions 1/2 retain previous coverage; a v3 plan preserves exact legacy records and migrates with zero invented options. V4 saves use a new key, retaining previous keys. Versionless data at the v3 key is rejected, since v3 always required an explicit version.
- Accessibility/layout: keyboard submission, labeled dialog, associated failure descriptions, predictable focus after option save/removal, text status distinctions, phone-width controls, and reduced motion are covered. Laptop and phone card screenshots were visually inspected. These are Chromium viewport checks, not physical-device or screen-reader certification.

Initial browser tests failed before title became optional and before section-option controls existed. Later tests reproduced option reordering, lost focus after removal, malformed error-description IDs caused by form input shadowing, missing v3 version acceptance, and an unnamed option dialog before their respective fixes. Locator corrections and interrupted harness runs are not counted as acceptance passes.

## Code review

Review boundary: `git diff eb8540f...HEAD`, plus final working-tree fixes. Two independent review agents ran the `/code-review` Standards and Spec axes.

- Standards: one P2 finding, accepting versionless v3 storage against the documented contract. A failing browser regression reproduced it; strict loading fixed it. Reviewer independently rechecked. Zero unresolved findings or actionable baseline smells.
- Spec: one P2 finding, missing accessible dialog name. A failing browser accessible-name assertion reproduced it; the dialog now references its heading and course/college/term context. Reviewer independently rechecked. Zero unresolved findings. The card summary also now says “Section options below” when options exist.

## Try it and limits

Open `index.html`, choose Classes → Add class, enter a code, college, and term; optional details can stay blank. Save, choose Add section option, enter `00042`, and select Preferred and Waitlisted. Add a backup, reload, export, and import the backup. Edit option changes only that option and the former preferred designation if necessary.

Existing class-level statuses/schedules remain separate manual records; new options do not yet populate calendar, forms, or degree estimates. Older Rillo versions cannot read v4 backups; retain an earlier backup when using an older checkout. No real OCR, physical phone, screen-reader session, or real calendar-app import was tested or claimed; integrated release validation remains #16. Student records are planning data, not official verification.
