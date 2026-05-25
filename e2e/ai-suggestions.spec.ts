import { test, expect, type Route } from '@playwright/test'

const DEMO_TRIP_MAP_URL = '/demo/demo-trip-lisboa/map'

function makeSuggestions() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `sug-${i}`,
    name: `Mock Spot ${i}`,
    category: ['food', 'culture', 'nature', 'sport', 'activity'][i % 5],
    description: `Description for spot ${i}`,
    address: `address ${i}`,
    lat: 38.7 + i * 0.001,
    lng: -9.1 + i * 0.001,
    mapbox_verified: i % 3 !== 0,
  }))
}

async function mockSuggestEndpoint(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ suggestions: makeSuggestions() }),
  })
}

/**
 * Clicks the "Suggérer" button via JS dispatch.
 *
 * The Vaul non-modal drawer sits at peek snap (180px). Playwright's built-in
 * click requires the element to be within the layout viewport; JS dispatch
 * bypasses that constraint. We wait for the button to appear in the DOM first.
 */
async function clickSuggestButton(page: import('@playwright/test').Page) {
  // Wait for the button to be in the DOM (the sheet with spots/suggérer renders async)
  await page.waitForSelector('button:has-text("Suggérer")', { timeout: 20_000 })
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    // Match "Suggérer" – the button text contains this word with é (U+00E9)
    const btn = btns.find((b) => b.textContent?.includes('Suggérer'))
    if (!btn) throw new Error('Suggérer button not found in DOM')
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

// Serial: avoids parallel IndexedDB contention between workers.
// Also needed because Vaul sets aria-hidden on background in headless mode.
test.describe.configure({ mode: 'serial' })

test.describe('AI Suggestions Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/spots/suggest', mockSuggestEndpoint)
  })

  test('Scenario 1: panel opens when user clicks "Suggérer" in the sheet', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await clickSuggestButton(page)
    // The AI panel opens — eyebrow shows "claude haiku"
    await expect(page.getByText(/claude haiku/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Mock Spot 0')).toBeVisible()
  })

  test('Scenario 2: multi-select + add inserts spots into the trip', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await clickSuggestButton(page)
    await expect(page.getByText('Mock Spot 0')).toBeVisible({ timeout: 15_000 })

    // AISuggestionCard uses role="checkbox" on the button element.
    // Dispatch JS clicks to avoid aria-hidden / viewport boundary issues.
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('[role="checkbox"]'))
      const spot0 = checkboxes.find((el) => el.textContent?.includes('Mock Spot 0'))
      const spot1 = checkboxes.find((el) => el.textContent?.includes('Mock Spot 1'))
      if (!spot0) throw new Error('Mock Spot 0 checkbox not found')
      if (!spot1) throw new Error('Mock Spot 1 checkbox not found')
      spot0.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      spot1.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    // "Ajouter 2 spots" button should be enabled after selecting 2
    const addBtn = page.getByRole('button', { name: /ajouter 2 spots/i })
    await expect(addBtn).toBeEnabled({ timeout: 5_000 })
    await addBtn.click()

    // After acceptance the panel closes
    await expect(page.getByText(/claude haiku/i)).not.toBeVisible({ timeout: 5_000 })
  })

  test('Scenario 3: error state appears when the endpoint fails', async ({ page }) => {
    // Override beforeEach route with 500 response
    await page.unroute('**/api/spots/suggest')
    await page.route('**/api/spots/suggest', (r) => r.fulfill({ status: 500, body: 'oops' }))

    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await clickSuggestButton(page)

    // Error message and retry button
    await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /r[ée]essayer/i })).toBeVisible()
  })

  test('Scenario 4: tweak prompt triggers a re-fetch', async ({ page }) => {
    let callCount = 0
    await page.unroute('**/api/spots/suggest')
    await page.route('**/api/spots/suggest', async (route) => {
      callCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: makeSuggestions() }),
      })
    })

    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await clickSuggestButton(page)
    await expect(page.getByText('Mock Spot 0')).toBeVisible({ timeout: 15_000 })

    // Capture count after mount (React StrictMode in dev invokes effects twice,
    // so initial mount may produce 1 or 2 calls depending on environment).
    const countBeforeRegen = callCount

    // Fill the hint input and click the Régénérer button (matched by aria-label)
    await page.getByPlaceholder(/guide-moi/i).fill('plus food rue')
    await page.getByRole('button', { name: /r[ée]g[ée]n[ée]rer/i }).click()

    // A re-fetch fires: total must increase by at least 1 from the pre-regen count
    await expect.poll(() => callCount, { timeout: 5_000 }).toBeGreaterThanOrEqual(countBeforeRegen + 1)
  })

  test('Scenario 5: close button dismisses the panel', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await clickSuggestButton(page)
    await expect(page.getByText(/claude haiku/i)).toBeVisible({ timeout: 15_000 })

    // The × close button has aria-label="Fermer"
    await page.getByRole('button', { name: /fermer/i }).click()
    await expect(page.getByText(/claude haiku/i)).not.toBeVisible({ timeout: 5_000 })
  })
})
