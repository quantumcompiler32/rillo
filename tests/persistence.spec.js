const { test, expect } = require('@playwright/test');
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
});
test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]); });

async function addClass(page, code = 'MATH 071') {
  await page.getByRole('button', { name: 'Add class', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Course code').fill(code);
  await form.getByLabel('Course name').fill('Calculus I');
  await form.getByLabel('College', { exact: true }).fill('Mission College');
  await form.getByLabel('Term', { exact: true }).fill('Spring 2027');
  return form;
}
async function backup(page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export plan', exact: true }).click();
  const stream = await (await download).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}
async function restore(page, value, accept = true) {
  page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss());
  await page.getByLabel('Import plan', { exact: true }).setInputFiles({
    name: 'plan.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))
  });
}

test('a failed save keeps the existing plan and the edited form available for retry', async ({ page }, testInfo) => {
  await page.goto('/');
  await (await addClass(page)).getByRole('button', { name: 'Save class', exact: true }).click();
  // Fault injection at the browser storage boundary, not the plan implementation.
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const form = await addClass(page, 'PHYS 004A');
  await form.getByRole('button', { name: 'Save class', exact: true }).click();
  await expect(form).toBeVisible();
  await expect(form.getByRole('alert')).toContainText('not saved');
  await expect(form.getByRole('alert')).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('failed-save.png') });
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await form.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#classList')).not.toContainText('PHYS 004A');
  await page.reload();
  await expect(page.locator('#classList')).toContainText('MATH 071');
  await expect(page.locator('#classList')).not.toContainText('PHYS 004A');
  const retry = await addClass(page, 'PHYS 004A');
  await retry.getByRole('button', { name: 'Save class', exact: true }).click();
  await page.reload();
  await expect(page.locator('#classList')).toContainText('PHYS 004A');
});

test('invalid restore cannot replace a valid plan or silently discard unknown relationships', async ({ page }) => {
  await page.goto('/');
  await (await addClass(page)).getByRole('button', { name: 'Save class', exact: true }).click();
  const saved = await backup(page);
  const invalid = structuredClone(saved);
  invalid.classes[0].status = 'Officially verified credit';
  await restore(page, invalid);
  await expect(page.locator('#planError')).toContainText('status');
  await expect(page.locator('#classList')).toContainText('Planned');
  await page.reload();
  expect(await backup(page)).toEqual(saved);
  const brokenReference = structuredClone(saved);
  brokenReference.classes[0].sectionOptionId = 'missing-option';
  await restore(page, brokenReference);
  await expect(page.locator('#planError')).toContainText('sectionOptionId');
  expect(await backup(page)).toEqual(saved);
});

function legacyPlan(version = 2) {
  const classes = [
    { id: 'course-completed', code: 'MATH 071', name: 'Calculus I', college: 'Mission College', term: 'Fall 2025', status: 'Completed', units: 5, section: '00017', days: 'MW', time: '9–10 AM', r40: 'Old authorization note', notes: 'Keep this attempt' },
    { id: 'course-withdrawn', code: 'MATH 071', name: 'Calculus I', college: 'Mission College', term: 'Spring 2025', status: 'Withdrawn', units: '', notes: 'Separate attempt' }
  ];
  const degrees = [{ id: 'degree-1', name: 'Mathematics', type: 'AS-T', college: 'Mission College', year: '2026–27', source: 'https://example.edu/math', requirements: ['MATH 071'], notes: 'Ask counselor' }];
  if (version === 1) return { version, classes, degrees };
  return {
    version, classes, degrees,
    registrations: [{ id: 'form-1', college: 'Mission College', term: 'Spring 2027', approval: 'Waiting for signatures', approvedCourses: 'MATH 071', registrationAt: '2026-11-16T09:00', formTarget: '2026-11-05', submittedOn: '', notes: 'Scope not specified' }],
    deadlines: [{ id: 'date-1', college: 'Mission College', term: 'Spring 2027', title: 'Personal deadline', at: '2026-11-10T14:30', leadDays: '3', source: 'https://example.edu/dates', notes: 'Check portal' }],
    transfers: [{ id: 'transfer-1', university: 'Example University', major: 'Engineering', source: 'https://example.edu/transfer', notes: 'Research only' }]
  };
}

test('supported legacy backups preserve history and identifiers across edit, reload, and restore', async ({ page }) => {
  await page.goto('/');
  for (const version of [1, 2]) {
    await restore(page, legacyPlan(version));
    await expect(page.locator('#toast')).toHaveText('Plan imported');
    const saved = await backup(page);
    expect(saved.version).toBe(4);
    expect(saved.classes.map(c => [c.id, c.status, c.section, c.r40, c.notes])).toEqual([
      ['course-completed', 'Completed', '00017', 'Old authorization note', 'Keep this attempt'],
      ['course-withdrawn', 'Withdrawn', undefined, undefined, 'Separate attempt']
    ]);
    await page.locator('#classList .card').filter({ hasText: 'Fall 2025' }).getByRole('button', { name: 'Edit', exact: true }).click();
    const form = page.getByRole('dialog');
    await form.getByLabel('Course name').fill('Calculus I reviewed');
    await form.getByRole('button', { name: 'Save class', exact: true }).click();
    const edited = await backup(page);
    expect(edited.classes[0].r40).toBe('Old authorization note');
    expect(edited.classes[0].days).toBe('MW');
    expect(edited.classes[0].time).toBe('9–10 AM');
    for (let i = 0; i < 2; i++) await page.reload();
    expect(await backup(page)).toEqual(edited);
    await restore(page, edited);
    await expect(page.locator('#toast')).toHaveText('Plan imported');
    expect(await backup(page)).toEqual(edited);
    await page.getByRole('link', { name: 'Degrees', exact: true }).click();
    await expect(page.locator('#degreeList')).toContainText('recorded complete; verify grade and applicability');
    if (version === 2) {
      expect(edited.registrations[0].approval).toBe('Waiting for signatures');
      expect(edited.registrations[0].notes).toBe('Scope not specified');
      expect(edited.transfers).toEqual(legacyPlan(2).transfers);
      expect(edited.deadlines).toEqual(legacyPlan(2).deadlines);
    }
    await page.getByRole('link', { name: 'Classes', exact: true }).click();
  }
});

test('corrupt storage cannot overwrite the last displayed valid plan and can recover by retry', async ({ page }) => {
  await page.goto('/');
  await (await addClass(page)).getByRole('button', { name: 'Save class', exact: true }).click();
  const saved = await backup(page);
  // Simulate external storage corruption, using storage only to inject the failure.
  await page.evaluate(() => {
    window.validStoredPlan = localStorage.getItem('rillo-plan-v4');
    localStorage.setItem('rillo-plan-v4', '{broken');
  });
  await page.getByRole('button', { name: 'Retry saved plan' }).click();
  await expect(page.locator('#planError')).toContainText('could not be opened');
  await expect(page.locator('#classList')).toContainText('MATH 071');
  await expect(page.locator('#planError')).toBeFocused();
  const form = await addClass(page, 'PHYS 004A');
  await form.getByRole('button', { name: 'Save class', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('Recover your saved plan');
  await form.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.reload();
  await expect(page.locator('#planError')).toContainText('could not be opened');
  // An explicit, valid backup replacement is the recovery path across reloads.
  await restore(page, saved);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  await page.reload();
  expect(await backup(page)).toEqual(saved);
});

test('current degree goals remain authoritative over stale legacy copies', async ({ page }) => {
  await page.goto('/');
  for (const current of [legacyPlan().degrees, []]) {
    const old = legacyPlan();
    old.degrees = current;
    old.legacyDegrees = [{ ...legacyPlan().degrees[0], id: 'deleted-physics', name: 'Deleted Physics goal' }];
    await restore(page, old);
    await expect(page.locator('#toast')).toHaveText('Plan imported');
    expect((await backup(page)).degrees).toEqual(current);
  }
  const old = legacyPlan();
  old.legacyDegrees = old.degrees;
  delete old.degrees;
  await restore(page, old);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  expect((await backup(page)).degrees).toEqual(old.legacyDegrees);
});

const invalidBackups = [
  ['unsupported version', p => { p.version = 999; }, 'version'],
  ['missing explicit version', p => { delete p.version; }, 'version'],
  ['non-array classes', p => { p.classes = {}; }, 'classes'],
  ['null record', p => { p.classes[0] = null; }, 'classes'],
  ['numeric identifier', p => { p.classes[0].id = 17; }, 'id'],
  ['duplicate identifier', p => { p.classes.push({ ...p.classes[0] }); }, 'id'],
  ['missing core field', p => { delete p.classes[0].college; }, 'college'],
  ['invalid units', p => { p.classes[0].units = 'several'; }, 'units'],
  ['impossible date', p => { p.registrations[0].formTarget = '2027-02-30'; }, 'formTarget'],
  ['invalid time', p => { p.deadlines[0].at = '2026-11-10T25:30'; }, 'at'],
  ['invalid reminder', p => { p.deadlines[0].leadDays = -2; }, 'leadDays'],
  ['invalid approval', p => { p.registrations[0].approval = 'Enrolled'; }, 'approval'],
  ['bad degree requirements', p => { p.degrees[0].requirements = [17]; }, 'requirements'],
  ['bad transfer goal', p => { p.transfers[0].major = {}; }, 'major'],
  ['unknown relationship collection', p => { p.sectionOptions = [{ id: 's1', plannedClassId: 'missing' }]; }, 'sectionOptions'],
  ['source images', p => { p.classes[0].sourceImage = 'data:image/png;base64,private'; }, 'sourceImage']
];
for (const [name, mutate, field] of invalidBackups) {
  test(`reject ${name} without replacing the existing plan`, async ({ page }) => {
    await page.goto('/');
    await restore(page, legacyPlan());
    await expect(page.locator('#toast')).toHaveText('Plan imported');
    const saved = await backup(page);
    const invalid = structuredClone(saved);
    mutate(invalid);
    await restore(page, invalid);
    await expect(page.locator('#planError')).toContainText(field);
    await expect(page.locator('#planError')).toBeFocused();
    expect(await backup(page)).toEqual(saved);
    await page.reload();
    expect(await backup(page)).toEqual(saved);
  });
}

test('invalid JSON, cancelled replacement, and failed replacement preserve the whole plan', async ({ page }) => {
  await page.goto('/');
  await restore(page, legacyPlan());
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  const saved = await backup(page);
  await page.getByLabel('Import plan', { exact: true }).setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.locator('#planError')).toContainText('Could not import');
  await restore(page, { version: 3, classes: [], registrations: [], deadlines: [], degrees: [], transfers: [] }, false);
  expect(await backup(page)).toEqual(saved);
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Write denied', 'SecurityError'); };
  });
  await restore(page, { version: 3, classes: [], registrations: [], deadlines: [], degrees: [], transfers: [] });
  await expect(page.locator('#planError')).toContainText('not saved');
  await expect(page.locator('#classList')).toContainText('MATH 071');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.reload();
  expect(await backup(page)).toEqual(saved);
});

for (const version of [1, 2]) {
  test(`load legacy version ${version} browser storage without duplication or lost notes`, async ({ page }) => {
    const fixture = legacyPlan(version);
    delete fixture.version; // Historical on-device plans did not contain a version field.
    await page.addInitScript(({ version, fixture }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(`rillo-plan-v${version}`, JSON.stringify(fixture));
        sessionStorage.setItem('seeded', 'yes');
      }
    }, { version, fixture });
    await page.goto('/');
    await expect(page.locator('#classList')).toContainText('Keep this attempt');
    const saved = await backup(page);
    await page.reload();
    expect(await backup(page)).toEqual(saved);
    await (await addClass(page, 'PHYS 004A')).getByRole('button', { name: 'Save class', exact: true }).click();
    await page.reload();
    const edited = await backup(page);
    expect(edited.classes).toHaveLength(3);
    expect(edited.classes[0].id).toBe('course-completed');
    expect(edited.classes[0].r40).toBe('Old authorization note');
  });
}

test('storage read failure preserves the displayed plan and Retry recovers it', async ({ page }) => {
  await page.goto('/');
  await restore(page, legacyPlan());
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  const saved = await backup(page);
  await page.evaluate(() => {
    window.originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new DOMException('Read denied', 'SecurityError'); };
  });
  await page.getByRole('button', { name: 'Retry saved plan' }).click();
  await expect(page.locator('#planError')).toContainText('could not be opened');
  await expect(page.locator('#classList')).toContainText('Keep this attempt');
  await page.evaluate(() => { Storage.prototype.getItem = window.originalGetItem; });
  await page.getByRole('button', { name: 'Retry saved plan' }).click();
  await expect(page.locator('#planError')).toBeHidden();
  expect(await backup(page)).toEqual(saved);
});

test('manual editors, deletion, goals, and deadline calendar export remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Registration', exact: true }).click();
  await page.getByRole('button', { name: 'Add college and term' }).click();
  let form = page.getByRole('dialog');
  await form.getByLabel('College', { exact: true }).fill('Example College');
  await form.getByLabel('Term', { exact: true }).fill('Spring 2027');
  await form.getByLabel('Approval form status').selectOption('Submitted');
  await form.getByLabel('Assigned registration date and time').fill('2026-11-12T09:30');
  await form.getByLabel('Courses listed on form').fill('MATH 071');
  await form.getByRole('button', { name: 'Save plan', exact: true }).click();
  await expect(page.locator('#registrationList')).toContainText('Submitted');

  await page.getByRole('link', { name: 'Classes', exact: true }).click();
  form = await addClass(page);
  await form.getByLabel('Section number').fill('00042');
  await form.getByRole('button', { name: 'Save class', exact: true }).press('Enter');
  await page.locator('#classList').getByRole('button', { name: 'Edit', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Course name').fill('Updated Calculus');
  await form.getByRole('button', { name: 'Save class', exact: true }).click();

  await page.getByRole('link', { name: 'Degrees', exact: true }).click();
  await page.getByRole('button', { name: 'Add degree goal', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Program', { exact: true }).fill('Mathematics');
  await form.getByLabel('Awarding college').fill('Mission College');
  await form.getByLabel('Catalog year').fill('2026–27');
  await form.getByLabel('Course requirements, one code per line').fill('MATH 071');
  await form.getByRole('button', { name: 'Save degree goal', exact: true }).click();
  await expect(page.locator('#degreeList')).toContainText('planned; not complete');

  await page.getByRole('link', { name: 'Transfer', exact: true }).click();
  await page.getByRole('button', { name: 'Add transfer goal', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('University', { exact: true }).fill('Example University');
  await form.getByLabel('Major', { exact: true }).fill('Engineering');
  await form.getByLabel('Notes and courses to check').fill('Confirm articulation');
  await form.getByRole('button', { name: 'Save transfer goal', exact: true }).click();

  await page.getByRole('link', { name: 'Deadlines', exact: true }).click();
  await page.getByRole('button', { name: 'Add date', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Title', { exact: true }).fill('Check, register; prepare');
  await form.getByLabel('College', { exact: true }).fill('Example College');
  await form.getByLabel('Term', { exact: true }).fill('Spring 2027');
  await form.getByLabel('Date and time', { exact: true }).fill('2026-11-10T14:30');
  await form.getByLabel('Remind me').selectOption('3');
  await form.getByRole('button', { name: 'Save date', exact: true }).click();
  const saved = await backup(page);
  expect(saved.classes[0].name).toBe('Updated Calculus');
  expect(saved.classes[0].section).toBe('00042');
  await page.reload();
  expect(await backup(page)).toEqual(saved);
  await restore(page, saved);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  expect(await backup(page)).toEqual(saved);

  await page.getByRole('link', { name: 'Deadlines', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download calendar with alerts' }).click();
  const stream = await (await downloading).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const calendar = Buffer.concat(chunks).toString();
  expect(calendar).toContain('SUMMARY:Check\\, register\\; prepare\r\n');
  expect(calendar).toContain('DTSTART:20261110T143000\r\n');
  expect(calendar).toContain('TRIGGER:-P3D\r\n');
  expect(calendar).toContain('DTSTART:20261112T093000\r\n');

  await page.getByRole('link', { name: 'Classes', exact: true }).click();
  // Failed deletion must be as transactional as adding or replacing a record.
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#classList').getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.locator('#planError')).toContainText('not saved');
  await expect(page.locator('#classList')).toContainText('Updated Calculus');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#classList').getByRole('button', { name: 'Remove', exact: true }).click();
  await page.reload();
  await expect(page.locator('#classList')).not.toContainText('Updated Calculus');
  const removed = await backup(page);
  expect(removed.classes).toEqual([]);
  expect(removed.registrations).toEqual(saved.registrations);
  expect(removed.degrees).toEqual(saved.degrees);
  expect(removed.transfers).toEqual(saved.transfers);
  expect(removed.deadlines).toEqual(saved.deadlines);
});

test('opening index directly still supports saving and reloading without a server', async ({ page }) => {
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await (await addClass(page)).getByRole('button', { name: 'Save class', exact: true }).click();
  await page.reload();
  await expect(page.locator('#classList')).toContainText('MATH 071');
  const saved = await backup(page);
  expect(saved.version).toBe(4);
  expect(saved.classes[0].code).toBe('MATH 071');
});

for (const field of ['name', 'meetingDays']) {
  test(`reject explicitly null legacy ${field} rather than repairing it silently`, async ({ page }) => {
    await page.goto('/');
    await (await addClass(page)).getByRole('button', { name: 'Save class', exact: true }).click();
    const saved = await backup(page);
    const invalid = legacyPlan();
    invalid.classes[0][field] = null;
    await restore(page, invalid);
    await expect(page.locator('#planError')).toContainText(field);
    await page.reload();
    expect(await backup(page)).toEqual(saved);
  });
}

test('corrupt newest storage never silently loads an older legacy plan', async ({ page }) => {
  await page.addInitScript(fixture => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('rillo-plan-v2', JSON.stringify(fixture));
      localStorage.setItem('rillo-plan-v4', '{broken');
      sessionStorage.setItem('seeded', 'yes');
    }
  }, legacyPlan());
  await page.goto('/');
  await expect(page.locator('#planError')).toContainText('could not be opened');
  await expect(page.locator('#classList')).not.toContainText('Keep this attempt');
  await (await addClass(page, 'PHYS 004A')).getByRole('button', { name: 'Save class', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Recover your saved plan');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.reload();
  await expect(page.locator('#planError')).toContainText('could not be opened');
  await restore(page, legacyPlan());
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  await expect(page.locator('#classList')).toContainText('Keep this attempt');
});
