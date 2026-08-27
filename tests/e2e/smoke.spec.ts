import { expect, test } from '@playwright/test'

test('dashboard opens directly without authentication', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/LensFlow/)
  await expect(page.getByText('LensFlow Watermark Pro').first()).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /masuk|login/i })).toHaveCount(0)
})

test('display route is available', async ({ page }) => {
  await page.goto('/display')
  await expect(page.locator('body')).toBeVisible()
})

test('public gallery route renders a safe empty state', async ({ page }) => {
  await page.goto('/gallery/demo-event?token=demo-token')
  await expect(page.getByRole('heading', { name: 'Galeri Foto' })).toBeVisible()
})
