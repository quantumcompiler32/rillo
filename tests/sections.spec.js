const { test, expect } = require('@playwright/test');

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
  await form.getByLabel('Section identifier', { exact: true }).fill(section);
  await form.getByLabel('Registration identifier', { exact: true }).fill('000123-A');
  await form.getByLabel('Instructor', { exact: true }).fill('Dr Example');
  await form.getByRole('combobox', { name: /^Preference/ }).selectOption(preference);
  await form.getByRole('combobox', { name: /^Registration status/ }).selectOption(status);
  await form.getByLabel('Notes', { exact: true }).fill('Check portal before registering');
  await form.getByRole('button', { name: 'Save option', exact: true }).press('Enter');
  await expect(form).toBeHidden();
}

test('options keep exact identifiers and independent preference/status across reload and restore', async ({ page }) => {
  await page.goto('/');
  const card = await addPlan(page);
  await addOption(page, card, '00042', 'Preferred', 'Waitlisted');
  await addOption(page, card, '00043', 'Backup');
  await expect(card).toContainText('Preferred · Waitlisted');
  await expect(card).toContainText('Backup · Considering');
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
