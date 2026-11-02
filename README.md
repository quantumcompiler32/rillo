# Rillo

Rillo is a browser-local registration, degree, and transfer planner for students taking classes at community colleges. San José City College (SJCC) and Mission College have tailored approval-form labels and official links; other colleges can be entered manually.

Open `index.html` in a browser. No build or account is required. Data stays in that browser's localStorage; export a backup before changing devices or clearing browser storage.

## What it does

- Track an approval plan by college and term: form status, submission target, submitted date, approved course codes, and personal registration time.
- Track planned, registered, waitlisted, in-progress, and completed classes with professor, section, days, times, and location.
- Save a future course with unknown title/units and no section yet. Add linked section options with exact section/registration identifiers, instructor, notes, and independent preference and registration status. Only one option per plan is preferred; choosing another does not change enrollment.
- Show a weekly class calendar and a list of registration dates and college deadlines.
- Show browser notifications when Rillo is open and permission is granted. Download an `.ics` file with reminders for a calendar app that can notify while Rillo is closed.
- Export and import a Rillo JSON plan. Existing version 1 classes and degree goals are migrated locally. Version 2 plans also retain registration records when degree and transfer goals are added. New saves and backups use version 4 with full validation; versions 1, 2, and 3 remain supported. Invalid imports and failed storage writes leave the previous plan unchanged. Use Retry saved plan or import a valid backup if browser storage cannot be opened.

- Track degree goals by awarding college and catalog year, showing recorded, planned, and pending cross-college course-code matches.
- Record university and major transfer goals with official source links and notes.

## Important limits

Rillo does not read your college account, submit forms, register for classes, verify approvals, or fetch your personal registration time. Enter the time shown in each college's student portal. Browser alerts are **not background push notifications**; they run only while Rillo is open. Importing the calendar file into a device calendar is the available closed-app reminder path. True web push would require a hosted backend, notification subscription, and a reliable scheduled delivery service.

Degree progress is an estimate based on manually entered course codes. It does not evaluate grades, general education, units, GPA, residency, catalog rights, or admissions eligibility. Transfer goals are research records, not admission predictions.

SJCC requires a new R-40 and application for each term and says students may register only for courses listed on the form. Mission uses its own Dual Enrollment Form. Verify your own dates and requirements using the official links in the app.

Professor links search Rate My Professors; ratings are not stored or presented as verified data.

## Development checks

Run `npm ci`, `npx playwright install chromium`, then `npm test` for browser acceptance tests at laptop and phone viewport sizes. `npm run check` checks JavaScript syntax. See [the persistence contract](docs/plan-persistence.md) for migration, recovery, schema extension, and testing limitations.

## Try section planning (#8)

Open `index.html`, choose **Classes → Add class**, enter code, college, and term, then save with optional details blank. Use **Add section option** on the saved card. Enter `00042`, choose **Preferred** and **Waitlisted**, save, and add a backup option. Reload or export/import to verify the choices remain separate.

A class with linked options cannot be deleted or reassigned to another course/college/term. Remove considering options first; retain waitlisted, registered, in-progress, completed, and withdrawn options as records. Record changes through Edit option. Section options do not yet feed the calendar, degree estimates, forms, or conflict checks; those workflows belong to later tickets. Existing class-level status and schedule remain separate manual records.
