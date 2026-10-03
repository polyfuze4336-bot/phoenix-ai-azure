import { test, expect } from '@playwright/test';

test('HCP switches between burn and general wound modes without logout', async ({ page }) => {
  await page.goto('/hcp-login');
  await page.locator('input[name="username"]').fill('admin.phoenix');
  await page.locator('input[name="password"]').fill('bfg123');
  await page.getByRole('button', { name: /^Sign In$/ }).click();
  await expect(page).toHaveURL(/\/hcp$/);

  const sidebar = page.locator('aside').first();
  const selector = page.getByRole('group', { name: 'Assessment mode' });
  await expect(selector.getByRole('button', { name: 'Acute Burn Injury' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sidebar.locator('a[href="/hcp/tbsa"]')).toBeVisible();
  await expect(sidebar.locator('a[href="/hcp/parkland"]')).toBeVisible();

  await selector.getByRole('button', { name: 'General Wound' }).click();
  await expect(sidebar.locator('a[href="/hcp/tbsa"]')).toHaveCount(0);
  await expect(sidebar.locator('a[href="/hcp/parkland"]')).toHaveCount(0);
  await expect(page.getByText('General wound clinical analytics only')).toBeVisible();

  await page.reload();
  await expect(selector.getByRole('button', { name: 'General Wound' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sidebar.getByRole('button', { name: 'General Wound' })).toHaveCount(0);

  await sidebar.locator('a[href="/hcp/guidelines"]').click();
  await expect(page.getByText('Wound Infection Reference')).toBeVisible();
  await expect(page.getByText('General Wound Reference')).toBeVisible();
  await expect(page.getByText('Reference document will be added later.').first()).toBeVisible();

  await page.getByRole('button', { name: /Bahasa Malaysia/i }).click();
  const bmSelector = page.getByRole('group', { name: 'Mod penilaian' });
  await expect(bmSelector.getByRole('button', { name: 'Luka Umum' })).toHaveAttribute('aria-pressed', 'true');
  await expect(bmSelector.getByRole('button', { name: 'Kecederaan Kelecuran Akut' })).toBeVisible();
});
