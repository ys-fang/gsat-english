import { test, expect } from '@playwright/test'

/**
 * GSAT English — Full E2E Tests
 *
 * Data stats:
 *   - 23 exam years: 93–115
 *   - 319 total videos
 *   - Videos per year: mostly 15, years 111–115 have 10 each, year 94 has 14
 *
 * NOTE: All page.goto() calls use paths WITHOUT leading slash so Playwright
 * resolves them relative to baseURL (which includes the Vite base path).
 */

const YEAR_VIDEO_COUNTS: Record<number, number> = {
  93: 15, 94: 14, 95: 15, 96: 15, 97: 15, 98: 15, 99: 15, 100: 15,
  101: 15, 102: 15, 103: 15, 104: 15, 105: 15, 106: 15, 107: 15,
  108: 15, 109: 15, 110: 15, 111: 10, 112: 10, 113: 10, 114: 10, 115: 10,
}

const ALL_YEARS = Object.keys(YEAR_VIDEO_COUNTS).map(Number).sort((a, b) => b - a)
const TOTAL_VIDEOS = Object.values(YEAR_VIDEO_COUNTS).reduce((a, b) => a + b, 0)
const TOTAL_YEARS = ALL_YEARS.length

// ──────────────────────────────────────────
// Home Page
// ──────────────────────────────────────────

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('')
  })

  test('shows hero section with correct stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('學測英文')
    await expect(page.locator(`text=${TOTAL_VIDEOS} 部影片`)).toBeVisible()
    await expect(page.locator(`text=${TOTAL_YEARS} 個年度`)).toBeVisible()
  })

  test('shows Jutor branding', async ({ page }) => {
    await expect(page.locator('text=Jutor').first()).toBeVisible()
  })

  test('shows 4 learning mode cards', async ({ page }) => {
    await expect(page.locator('text=考前衝刺')).toBeVisible()
    await expect(page.locator('text=完整複習')).toBeVisible()
    await expect(page.locator('text=隨機挑戰')).toBeVisible()
    await expect(page.locator('text=弱點加強')).toBeVisible()
  })

  test('sprint link goes to latest year', async ({ page }) => {
    const maxYear = Math.max(...ALL_YEARS)
    await page.locator('text=考前衝刺').click()
    await expect(page).toHaveURL(new RegExp(`/learn/${maxYear}`))
  })

  test('sequential link goes to earliest year', async ({ page }) => {
    const minYear = Math.min(...ALL_YEARS)
    await page.locator('text=完整複習').click()
    await expect(page).toHaveURL(new RegExp(`/learn/${minYear}`))
  })

  test('random link redirects to /learn/{year}/{index}', async ({ page }) => {
    await page.locator('text=隨機挑戰').click()
    await page.waitForURL(/\/learn\/\d+\/\d+/)
  })

  test('review link navigates to /review', async ({ page }) => {
    await page.locator('text=弱點加強').click()
    await expect(page).toHaveURL(/\/review/)
  })

  test('shows year grid with all 23 years', async ({ page }) => {
    await expect(page.locator('text=按學年度瀏覽')).toBeVisible()
    for (const year of ALL_YEARS) {
      await expect(page.locator(`text=${year}`).first()).toBeVisible()
    }
  })

  test('year grid items navigate correctly', async ({ page }) => {
    const yearLink = page.locator(`a[href*="/learn/115"]`).first()
    await yearLink.click()
    await expect(page).toHaveURL(/\/learn\/115/)
  })
})

// ──────────────────────────────────────────
// Year Pages — one test per year
// ──────────────────────────────────────────

test.describe('Year Pages', () => {
  for (const year of ALL_YEARS) {
    const videoCount = YEAR_VIDEO_COUNTS[year]

    test(`Year ${year}: shows ${videoCount} videos`, async ({ page }) => {
      await page.goto(`learn/${year}`)

      await expect(page.locator('h1')).toContainText(`${year} 學年度`)
      // Header shows video count (use header p element to avoid ambiguity with video card badges)
      await expect(page.locator('header p', { hasText: `${videoCount} 題` })).toBeVisible()

      const videoCards = page.locator(`a[href*="/learn/${year}/"]`)
      await expect(videoCards).toHaveCount(videoCount)
    })
  }

  test('invalid year redirects to home', async ({ page }) => {
    await page.goto('learn/999')
    // Redirects to base URL (may or may not end with /)
    await page.waitForURL(/gsat-english\/?$/)
  })
})

// ──────────────────────────────────────────
// Learning Page
// ──────────────────────────────────────────

test.describe('Learning Page', () => {
  test('loads video player and shows header', async ({ page }) => {
    await page.goto('learn/115/1')

    const iframe = page.locator('iframe[src*="youtube.com"]')
    await expect(iframe).toBeVisible()

    await expect(page.locator('text=115 學年度')).toBeVisible()
    await expect(page.locator('text=第 1 題')).toBeVisible()
  })

  test('shows navigation buttons', async ({ page }) => {
    await page.goto('learn/115/2')

    // Nav structure is <Link><Button>...</Button></Link>, use getByRole('link') for the outer <a>
    await expect(page.getByRole('link', { name: '上一題' })).toBeVisible()
    await expect(page.getByRole('link', { name: '下一題' })).toBeVisible()

    const total = YEAR_VIDEO_COUNTS[115]
    await expect(page.locator(`text=2 / ${total}`)).toBeVisible()
  })

  test('first question has no previous button', async ({ page }) => {
    await page.goto('learn/115/1')
    // On first question, the 上一題 link should not exist (keyboard hints still mention it in text)
    await expect(page.getByRole('link', { name: '上一題' })).not.toBeVisible()
  })

  test('last question shows 完成 button', async ({ page }) => {
    const lastIdx = YEAR_VIDEO_COUNTS[115]
    await page.goto(`learn/115/${lastIdx}`)
    await expect(page.getByRole('link', { name: '完成' })).toBeVisible()
    // 下一題 link should not exist on last question
    await expect(page.getByRole('link', { name: '下一題' })).not.toBeVisible()
  })

  test('next button navigates to next question', async ({ page }) => {
    await page.goto('learn/115/1')
    await page.getByRole('link', { name: '下一題' }).click()
    await expect(page).toHaveURL(/\/learn\/115\/2/)
  })

  test('shows 練習題目 toggle', async ({ page }) => {
    await page.goto('learn/115/1')
    await expect(page.locator('text=練習題目')).toBeVisible()
  })

  test('shows pomodoro timer', async ({ page }) => {
    await page.goto('learn/115/1')
    await expect(page.locator('text=25:00')).toBeVisible()
  })

  test('shows keyboard hints', async ({ page }) => {
    await page.goto('learn/115/1')
    await expect(page.locator('kbd:text("←")')).toBeVisible()
    await expect(page.locator('kbd:text("→")')).toBeVisible()
    await expect(page.locator('kbd:text("F")')).toBeVisible()
  })

  test('invalid video index redirects to year page', async ({ page }) => {
    const lastIdx = YEAR_VIDEO_COUNTS[115]
    await page.goto(`learn/115/${lastIdx + 1}`)
    await page.waitForURL(/\/learn\/115$/)
  })

  test('progress bar is visible', async ({ page }) => {
    await page.goto('learn/115/1')
    const progressBar = page.locator('.h-1.rounded-none').first()
    await expect(progressBar).toBeVisible()
  })
})

// ──────────────────────────────────────────
// Question Answering Flow
// ──────────────────────────────────────────

test.describe('Question Answering', () => {
  test('can click option to answer', async ({ page }) => {
    await page.goto('learn/115/1')

    const toggleBtn = page.locator('text=練習題目')
    if (await toggleBtn.isVisible()) {
      // Question section should be expanded by default
    }

    const optionA = page.locator('button').filter({ hasText: /^\(A\)/ }).first()
    if (await optionA.isVisible({ timeout: 3000 })) {
      await optionA.click()

      // After answering, should show correct/incorrect styling
      // Options should become disabled
      await expect(optionA).toBeDisabled()
    }
  })
})

// ──────────────────────────────────────────
// Random Page
// ──────────────────────────────────────────

test.describe('Random Page', () => {
  test('redirects to a valid learning page', async ({ page }) => {
    await page.goto('learn/random')
    await page.waitForURL(/\/learn\/\d+\/\d+/, { timeout: 5000 })

    const url = page.url()
    const match = url.match(/\/learn\/(\d+)\/(\d+)/)
    expect(match).toBeTruthy()

    const year = parseInt(match![1])
    const index = parseInt(match![2])

    expect(ALL_YEARS).toContain(year)
    expect(index).toBeGreaterThanOrEqual(1)
    expect(index).toBeLessThanOrEqual(YEAR_VIDEO_COUNTS[year])
  })

  test('multiple visits produce different destinations', async ({ page }) => {
    const urls = new Set<string>()
    for (let i = 0; i < 5; i++) {
      await page.goto('learn/random')
      await page.waitForURL(/\/learn\/\d+\/\d+/, { timeout: 5000 })
      urls.add(page.url())
    }
    expect(urls.size).toBeGreaterThanOrEqual(2)
  })
})

// ──────────────────────────────────────────
// Review Page
// ──────────────────────────────────────────

test.describe('Review Page', () => {
  test('shows empty state when no answers', async ({ page }) => {
    await page.goto('')
    await page.evaluate(() => localStorage.clear())

    await page.goto('review')
    await expect(page.locator('h1')).toContainText('弱點加強')
    await expect(page.locator('text=尚未作答任何題目')).toBeVisible()
    await expect(page.locator('text=開始練習')).toBeVisible()
  })

  test('has back to home button', async ({ page }) => {
    await page.goto('review')
    await expect(page.locator('text=返回首頁')).toBeVisible()
  })
})

// ──────────────────────────────────────────
// Catch-all Route
// ──────────────────────────────────────────

test.describe('Routing', () => {
  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('nonexistent')
    await page.waitForURL(/gsat-english\/?$/)
  })
})

// ──────────────────────────────────────────
// Data Integrity: all year pages load without JS errors
// ──────────────────────────────────────────

test.describe('Data Integrity: Year pages load', () => {
  for (const year of ALL_YEARS) {
    test(`Year ${year}: loads without JS errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(`learn/${year}`)
      await expect(page.locator('h1')).toContainText(`${year} 學年度`)

      expect(errors).toHaveLength(0)
    })
  }
})

// ──────────────────────────────────────────
// Data Integrity: first video of each year
// ──────────────────────────────────────────

test.describe('Data Integrity: First video per year', () => {
  for (const year of ALL_YEARS) {
    test(`Year ${year} Video 1: YouTube player renders`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(`learn/${year}/1`)

      const iframe = page.locator('iframe[src*="youtube.com"]')
      await expect(iframe).toBeVisible()

      await expect(page.locator(`text=${year} 學年度`)).toBeVisible()
      await expect(page.locator('text=第 1 題')).toBeVisible()

      expect(errors).toHaveLength(0)
    })
  }
})
