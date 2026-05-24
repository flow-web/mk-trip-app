import { test, expect } from '@playwright/test'

// Demo trip URL: /demo/<tripId>/map
// Trip ID confirmed from lib/demo/fixtures.ts — demoTrips[0].id = 'demo-trip-lisboa'
const DEMO_TRIP_MAP_URL = '/demo/demo-trip-lisboa/map'

/**
 * Clicks the first spot button in the MapSpotSheet list via JS dispatch.
 *
 * The Vaul drawer renders at "peek" snap (180px), which puts the spot list below
 * the viewport boundary. Playwright's built-in click (even with force:true) still
 * requires the element to be within the layout viewport. We bypass this by
 * dispatching a synthetic click event directly on the DOM node.
 */
async function clickFirstSpotViaJS(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('ul > li button') as HTMLElement | null
    if (!btn) throw new Error('No spot button found in the DOM')
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

// Run serially: Vaul sets aria-hidden on the background page in headless mode,
// and parallel tabs compound the issue. Serial mode keeps 1 browser context active.
test.describe.configure({ mode: 'serial' })

test.describe('Map Shell v2', () => {
  test('Scenario 1: opens with all spots visible and "Tous" selected', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await expect(page.getByTestId('map-shell')).toBeVisible({ timeout: 20_000 })

    // The MapDayDock toolbar sits BEHIND the Vaul non-modal drawer.
    // Vaul still sets aria-hidden on elements outside the dialog in non-modal mode,
    // so getByRole('toolbar') cannot find the dock via the accessibility tree.
    // Use a CSS attribute selector instead to bypass the aria-hidden constraint.
    const toolbar = page.locator('[role="toolbar"][aria-label="Filtre par jour"]')
    await expect(toolbar).toBeVisible({ timeout: 30_000 })

    // "Tous" button: scoped to the toolbar via CSS, then check aria-pressed
    const tousBtn = toolbar.locator('button').first() // "Tous" is first button
    await expect(tousBtn).toHaveAttribute('aria-pressed', 'true')

    // Bottom sheet shows spot count (Lisboa fixture has 8 spots)
    await expect(page.getByText(/\d+ spots?/)).toBeVisible({ timeout: 10_000 })
  })

  // Lisboa spots are linked to days (commit fca0851):
  // s1, s2, s7 → d1 (J1, 3 spots); s3, s4 → d2; s5, s6 → d3; s8 → d4
  test('Scenario 2: clicking a day pill filters spots', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    const toolbar = page.locator('[role="toolbar"][aria-label="Filtre par jour"]')
    await expect(toolbar).toBeVisible({ timeout: 30_000 })
    // J1 is the second button in the toolbar (after "Tous")
    const j1 = toolbar.locator('button').nth(1)
    await expect(j1).toContainText('J1')
    await j1.click({ force: true })
    await expect(j1).toHaveAttribute('aria-pressed', 'true')
    // Label changes to "Jour 1" when day is selected (J1 has 3 spots)
    await expect(page.getByText(/jour 1/i)).toBeVisible()
    await expect(page.getByText(/3 spots/i)).toBeVisible()
  })

  test('Scenario 3: clicking a spot in the sheet opens the detail sheet', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await expect(page.getByTestId('map-shell')).toBeVisible({ timeout: 20_000 })
    // Wait for spots to load in the bottom sheet
    await expect(page.getByText(/\d+ spots?/)).toBeVisible({ timeout: 20_000 })
    const firstSpot = page.locator('ul > li button').first()
    await expect(firstSpot).toBeVisible({ timeout: 10_000 })
    const spotName = await firstSpot.locator('.font-medium').first().textContent()
    // Dispatch click via JS: the Vaul drawer sits at peek snap (180px) so the
    // spot list items are below Playwright's layout-viewport boundary.
    await clickFirstSpotViaJS(page)
    // Detail sheet close button appears (aria-label="Fermer")
    await expect(page.getByRole('button', { name: /fermer/i })).toBeVisible({ timeout: 10_000 })
    if (spotName) {
      await expect(page.getByRole('heading', { name: spotName })).toBeVisible()
    }
  })

  test('Scenario 4: closing the detail sheet returns to the spot list', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await expect(page.getByTestId('map-shell')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/\d+ spots?/)).toBeVisible({ timeout: 20_000 })
    const firstSpot = page.locator('ul > li button').first()
    await expect(firstSpot).toBeVisible({ timeout: 10_000 })
    // Dispatch click via JS — same viewport reason as Scenario 3
    await clickFirstSpotViaJS(page)
    const closeBtn = page.getByRole('button', { name: /fermer/i })
    await expect(closeBtn).toBeVisible({ timeout: 10_000 })
    await closeBtn.click()
    await expect(closeBtn).not.toBeVisible()
    // Spot list is visible again
    await expect(page.getByText(/\d+ spots?/)).toBeVisible()
  })
})
