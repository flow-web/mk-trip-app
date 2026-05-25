import { test, expect } from '@playwright/test'

test.describe('Chat du trip', () => {
  test('envoyer un message et le voir apparaître', async ({ page }) => {
    await page.goto('/trips')
    const tripLink = page.getByRole('link').filter({ hasText: /trip/i }).first()
    await tripLink.click()

    await page.getByRole('link', { name: 'Chat' }).first().click()
    await expect(page).toHaveURL(/\/chat$/)

    await expect(page.getByText('Aucun message')).toBeVisible()

    const input = page.getByPlaceholder('Message...')
    await input.fill('Hello depuis le test E2E !')
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click()

    await expect(page.getByText('Hello depuis le test E2E !')).toBeVisible()
    await expect(page.getByText('Aucun message')).not.toBeVisible()
  })
})
