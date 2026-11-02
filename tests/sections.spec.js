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
