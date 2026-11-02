const { test, expect } = require('@playwright/test');

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

test('a failed save keeps the existing plan and the edited form available for retry', async ({ page }) => {
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
