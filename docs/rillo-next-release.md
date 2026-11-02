# Rillo next release: design decisions

Status: interview in progress; not an implementation specification.

## Confirmed direction

Confirmed by Moksh on November 1, 2026:

- The first priority is importing courses from screenshots or photographs with less manual entry. Actionable registration guidance follows using reviewed course records.
- Design for Moksh's real workflow first, then validate with a small MMCHS student pilot.
- Keep image processing on-device for the first release, with manual correction as the fallback. If extraction quality is inadequate, revisit the processing trade-off explicitly before adding external processing.
- Registration, degree, and transfer planning remain in the broader product vision. This release narrows the immediate work rather than removing those goals.

## Still to settle

- Initial image formats and layouts, and whether paper-photo extraction belongs in the first release.
- Review granularity and handling of uncertain fields and course statuses.
- Reconciliation with existing records and repeat imports.
- Original-image retention after review.
- The view and next steps shown after saving.
- Acceptance examples, recovery behavior, and device validation.

Related: [product roadmap](rillo-product-roadmap.md) and [overall decision map](https://github.com/quantumcompiler32/rillo/issues/1).
