import { test, expect } from '@playwright/test'

test.describe('Learning Flow', () => {
  test('should render homepage with learning modes', async ({ page }) => {
    await page.goto('/')

    // Should show app title
    await expect(page.locator('h1')).toContainText('LearnGASAT')

    // Should show learning modes
    await expect(page.getByText('考前衝刺')).toBeVisible()
    await expect(page.getByText('完整複習')).toBeVisible()
    await expect(page.getByText('隨機挑戰')).toBeVisible()
    await expect(page.getByText('弱點加強')).toBeVisible()

    // Should show year buttons using exact role match
    await expect(page.getByRole('button', { name: /^115/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^98/ })).toBeVisible()
  })

  test('should navigate to year page when clicking a year', async ({
    page,
  }) => {
    await page.goto('/')

    // Click on year 115
    await page.getByRole('link', { name: /115/ }).first().click()

    // Should navigate to year page
    await expect(page).toHaveURL(/\/learn\/115/)
    await expect(page.locator('h1')).toContainText('115 學年度')
  })

  test('should navigate to learning page from year page', async ({
    page,
  }) => {
    await page.goto('/learn/115')

    // Click first video
    await page.getByRole('link').filter({ hasText: '第 1 題' }).click()

    // Should navigate to learning view
    await expect(page).toHaveURL(/\/learn\/115\/1/)

    // Should show video player (iframe)
    await expect(page.locator('iframe')).toBeVisible()

    // Should show navigation button
    await expect(
      page.getByRole('button', { name: '下一題' })
    ).toBeVisible()
  })

  test('should navigate between questions', async ({ page }) => {
    await page.goto('/learn/115/1')

    // Click next button
    await page.getByRole('button', { name: '下一題' }).click()
    await expect(page).toHaveURL(/\/learn\/115\/2/)

    // Click prev button
    await page.getByRole('button', { name: '上一題' }).click()
    await expect(page).toHaveURL(/\/learn\/115\/1/)
  })

  test('should show question card if question data exists', async ({
    page,
  }) => {
    await page.goto('/learn/115/1')

    // Should show question toggle
    await expect(page.getByText('練習題目')).toBeVisible()

    // Question section should be expanded by default and show the confirm button
    await expect(
      page.getByRole('button', { name: '確認答案' })
    ).toBeVisible()
  })

  test('should show keyboard navigation hints', async ({ page }) => {
    await page.goto('/learn/115/1')

    // Check the keyboard hints section exists
    await expect(page.locator('kbd')).toHaveCount(3)
  })
})

test.describe('Year Page', () => {
  test('should show all videos for a year', async ({ page }) => {
    await page.goto('/learn/115')

    // Should show video thumbnails
    const videoCards = page.getByRole('link').filter({ hasText: '第' })
    await expect(videoCards.first()).toBeVisible()
  })

  test('should show back button to homepage', async ({ page }) => {
    await page.goto('/learn/115')

    // Click back button
    await page.getByRole('link').first().click()

    // Should be back on homepage
    await expect(page).toHaveURL('/')
  })

  test('should return 404 for invalid year', async ({ page }) => {
    const response = await page.goto('/learn/999')
    expect(response?.status()).toBe(404)
  })
})

test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be usable on mobile viewport', async ({ page }) => {
    await page.goto('/')

    // Title should be visible
    await expect(page.locator('h1')).toContainText('LearnGASAT')

    // Learning modes should stack vertically
    await expect(page.getByText('考前衝刺')).toBeVisible()
  })

  test('should render learning page correctly on mobile', async ({
    page,
  }) => {
    await page.goto('/learn/115/1')

    // Video should be visible
    await expect(page.locator('iframe')).toBeVisible()

    // Navigation button should be visible
    await expect(
      page.getByRole('button', { name: '下一題' })
    ).toBeVisible()
  })
})
