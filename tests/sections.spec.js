const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); });

async function addPlan(page, { college = 'Mission College', term = 'Spring 2028', status = 'Planned' } = {}) {
  await page.getByRole('button', { name: 'Add class', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Course code').fill('MATH 071');
  await form.getByLabel('College', { exact: true }).fill(college);
  await form.getByLabel('Term', { exact: true }).fill(term);
  await form.getByRole('combobox', { name: /^Status/ }).selectOption(status);
  await form.getByRole('button', { name: 'Save class', exact: true }).press('Enter');
  await expect(form).toBeHidden();
  return page.locator('#classList > article').last();
}
async function backup(page) {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export plan', exact: true }).click();
  const stream = await (await downloading).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}
async function restore(page, plan) {
  page.once('dialog', d => d.accept());
  await page.getByLabel('Import plan', { exact: true }).setInputFiles({ name: 'plan.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(plan)) });
}

test('future planned class needs no title, units, instructor, or section', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  await expect(card).toContainText('Title unknown');
  await expect(card).toContainText('Units unknown');
  await expect(card).toContainText('No section selected yet');
  await expect(card).toContainText('Planned');
  await page.reload();
  await expect(page.locator('#classList')).toContainText('No section selected yet');
  const saved = await backup(page);
  await restore(page, saved);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  expect(await backup(page)).toEqual(saved);
});

async function addOption(page, card, section, preference = 'None', status = 'Considering') {
  await card.getByRole('button', { name: 'Add section option', exact: true }).click();
  const form = page.getByRole('dialog');
  await expect(form).toHaveAccessibleName('Section option');
  await form.getByLabel('Section identifier', { exact: true }).fill(section);
  await form.getByLabel('Registration identifier', { exact: true }).fill('000123-A');
  await form.getByLabel('Instructor', { exact: true }).fill('Dr Example');
  await form.getByRole('combobox', { name: /^Preference/ }).selectOption(preference);
  await form.getByRole('combobox', { name: /^Registration status/ }).selectOption(status);
  await form.getByLabel('Notes', { exact: true }).fill('Check portal before registering');
  await form.getByRole('button', { name: 'Save option', exact: true }).press('Enter');
  await expect(form).toBeHidden();
}

test('options keep exact identifiers and independent preference/status across reload and restore', async ({ page }, testInfo) => {
  await page.goto('/');
  const card = await addPlan(page);
  await addOption(page, card, '00042', 'Preferred', 'Waitlisted');
  await addOption(page, card, '00043', 'Backup');
  await expect(card).toContainText('Preferred · Waitlisted');
  await expect(card).toContainText('Backup · Considering');
  await card.screenshot({ path: testInfo.outputPath('section-options.png') });
  expect((await card.boundingBox()).width).toBeLessThanOrEqual(page.viewportSize().width);
  await expect(card).toContainText('000123-A');
  await expect(card).toContainText('Planned');
  const saved = await backup(page);
  expect(saved.sectionOptions.map(o => [o.section, o.registrationId, o.preference, o.status])).toEqual([
    ['00042', '000123-A', 'Preferred', 'Waitlisted'], ['00043', '000123-A', 'Backup', 'Considering']
  ]);
  await page.reload();
  await expect(page.locator('#classList')).toContainText('Preferred · Waitlisted');
  expect(await backup(page)).toEqual(saved);
  await restore(page, saved);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  expect(await backup(page)).toEqual(saved);
  await expect(page.locator('#classList')).toContainText('Backup · Considering');
});

test('editing an option preserves its identity and position while changing preference independently', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  await addOption(page, card, '00042', 'Preferred', 'Waitlisted');
  await addOption(page, card, '00043', 'Backup');
  const before = await backup(page);
  await card.getByRole('button', { name: 'Edit option', exact: true }).first().click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Section identifier', { exact: true }).fill('00042-X');
  await form.getByRole('button', { name: 'Save option', exact: true }).click();
  const edited = await backup(page);
  expect(edited.sectionOptions.map(o => o.id)).toEqual(before.sectionOptions.map(o => o.id));
  expect(edited.sectionOptions[0].section).toBe('00042-X');
  await card.getByRole('button', { name: 'Edit option', exact: true }).last().click();
  await page.getByRole('dialog').getByRole('combobox', { name: /^Preference/ }).selectOption('Preferred');
  await page.getByRole('button', { name: 'Save option', exact: true }).click();
  await expect(card).toContainText('None · Waitlisted');
  await expect(card).toContainText('Preferred · Considering');
  const saved = await backup(page);
  expect(saved.classes).toEqual(before.classes);
  expect(saved.sectionOptions.map(o => o.status)).toEqual(['Waitlisted', 'Considering']);
});

test('removal retains linked plans/history and returns focus after deleting a considering option', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  await addOption(page, card, '001', 'Preferred', 'Completed');
  const saved = await backup(page);
  await card.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.locator('#planError')).toContainText('linked section options');
  await card.getByRole('button', { name: 'Remove option', exact: true }).click();
  await expect(page.locator('#planError')).toContainText('Retain waitlisted');
  expect(await backup(page)).toEqual(saved);
  await addOption(page, card, '002', 'Backup');
  page.once('dialog', d => d.accept());
  await card.getByRole('button', { name: 'Remove option', exact: true }).last().click();
  await expect(card).not.toContainText('Section 002');
  await expect(card.getByRole('button', { name: 'Add section option', exact: true })).toBeFocused();
  expect(await backup(page)).toEqual(saved);
  await page.reload();
  await expect(page.locator('#classList')).toContainText('Preferred · Completed');
});

test('failed option saves and invalid backups preserve the whole plan and allow correction', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  await addOption(page, card, '001', 'Preferred', 'Waitlisted');
  const saved = await backup(page);
  await card.getByRole('button', { name: 'Edit option', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Section identifier', { exact: true }).fill('009');
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await form.getByRole('button', { name: 'Save option', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('not saved');
  await expect(form.getByRole('alert')).toBeFocused();
  await expect(form.locator('form')).toHaveAttribute('aria-describedby', 'optionFormError');
  await expect(card).toContainText('Section 001');
  await expect(form.getByLabel('Section identifier', { exact: true })).toHaveValue('009');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await form.getByRole('button', { name: 'Save option', exact: true }).click();
  await expect(card).toContainText('Section 009');
  await expect(card.getByRole('button', { name: 'Add section option', exact: true })).toBeFocused();
  const corrected = await backup(page);
  for (const mutate of [
    p => { p.sectionOptions[0].plannedClassId = 'missing'; },
    p => { p.sectionOptions[0].section = 9; },
    p => { p.sectionOptions[0].preference = 'Enrolled'; },
    p => { p.sectionOptions[0].status = 'Approved'; },
    p => { p.sectionOptions.push({ ...p.sectionOptions[0] }); },
    p => { p.sectionOptions.push({ ...p.sectionOptions[0], id: 'second-preferred' }); },
    p => { p.classes = []; }
  ]) {
    const invalid = structuredClone(corrected);
    mutate(invalid);
    await restore(page, invalid);
    await expect(page.locator('#planError')).toBeVisible();
    expect(await backup(page)).toEqual(corrected);
  }
  await page.reload();
  expect(await backup(page)).toEqual(corrected);
});

test('different colleges, terms, and attempts stay distinct; linked context cannot be reassigned', async ({ page }) => {
  await page.goto('/');
  await addPlan(page);
  await addPlan(page);
  await addPlan(page, { college: 'Example College' });
  await addPlan(page, { term: 'Fall 2028', status: 'Withdrawn' });
  const cards = page.locator('#classList > article');
  const target = cards.filter({ hasText: 'Mission College · Spring 2028' }).first();
  await addOption(page, target, '00001');
  const before = await backup(page);
  expect(before.classes).toHaveLength(4);
  expect(new Set(before.classes.map(c => c.id)).size).toBe(4);
  await target.getByRole('button', { name: 'Edit', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('College', { exact: true }).fill('Other College');
  await form.getByRole('button', { name: 'Save class', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('linked section options');
  await expect(form.getByRole('alert')).toBeFocused();
  await form.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await backup(page)).toEqual(before);
  page.once('dialog', d => d.accept());
  await target.getByRole('button', { name: 'Remove option', exact: true }).click();
  page.once('dialog', d => d.accept());
  await target.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.reload();
  const after = await backup(page);
  expect(after.classes).toEqual(before.classes.slice(1));
  expect(after.sectionOptions).toEqual([]);
  await expect(page.locator('#classList')).toContainText('Withdrawn');
});

test('version 3 plans migrate without inventing options or losing exact legacy information', async ({ page }) => {
  const old = { version: 3, classes: [{ id: 'legacy', college: 'Mission College', term: 'Fall 2026', code: 'MATH 071', status: 'Registered', section: '00017', professor: 'Original Instructor', r40: 'Submitted only', notes: 'Keep this record', days: 'MW', time: '9 AM' }], registrations: [], deadlines: [], degrees: [], transfers: [] };
  await page.addInitScript(value => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('rillo-plan-v3', JSON.stringify(value));
      sessionStorage.setItem('seeded', 'yes');
    }
  }, old);
  await page.goto('/');
  const migrated = await backup(page);
  expect(migrated.version).toBe(4);
  expect(migrated.classes).toEqual(old.classes);
  expect(migrated.sectionOptions).toEqual([]);
  await addOption(page, page.locator('#classList > article'), '00018', 'Backup');
  const saved = await backup(page);
  expect(saved.classes).toEqual(old.classes);
  await page.reload();
  expect(await backup(page)).toEqual(saved);
  await restore(page, saved);
  await expect(page.locator('#toast')).toHaveText('Plan imported');
  expect(await backup(page)).toEqual(saved);
});

test('versionless data at the v3 storage key is rejected rather than silently promoted', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rillo-plan-v3', JSON.stringify({ classes: [], registrations: [], deadlines: [], degrees: [], transfers: [] }));
  });
  await page.goto('/');
  await expect(page.locator('#planError')).toContainText('version');
  await expect(page.locator('#planError')).toBeFocused();
});

test('unknown option details and every reported status remain explicit without changing the planned class', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  const before = await backup(page);
  await card.getByRole('button', { name: 'Add section option', exact: true }).click();
  await page.getByRole('button', { name: 'Save option', exact: true }).press('Enter');
  await expect(card).toContainText('Section unknown');
  await expect(card).toContainText('Registration identifier: unknown · Instructor: not selected yet');
  for (const status of ['Waitlisted', 'Registered', 'In progress', 'Completed', 'Withdrawn', 'No longer considering']) {
    await card.getByRole('button', { name: 'Edit option', exact: true }).click();
    await page.getByRole('dialog').getByRole('combobox', { name: /^Registration status/ }).selectOption(status);
    await page.getByRole('button', { name: 'Save option', exact: true }).click();
    await expect(card).toContainText(`None · ${status}`);
    expect((await backup(page)).classes).toEqual(before.classes);
  }
  const saved = await backup(page);
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  page.once('dialog', d => d.accept());
  await card.getByRole('button', { name: 'Remove option', exact: true }).click();
  await expect(page.locator('#planError')).toContainText('not saved');
  await expect(page.locator('#planError')).toBeFocused();
  expect(await backup(page)).toEqual(saved);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  page.once('dialog', d => d.dismiss());
  await card.getByRole('button', { name: 'Remove option', exact: true }).click();
  expect(await backup(page)).toEqual(saved);
  await page.reload();
  expect(await backup(page)).toEqual(saved);
});
