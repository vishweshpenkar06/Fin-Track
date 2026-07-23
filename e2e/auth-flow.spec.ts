import { test, expect } from '@playwright/test'

// This E2E test verifies the core user journey: sign up → login → add expense → view on dashboard → logout
// Requirements: Real DATABASE_URL and BETTER_AUTH_SECRET set in .env
// Can be run locally with: pnpm test:e2e

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('FinTrack Authentication & Core Flow', () => {
  test('should complete sign up, login, add expense, and logout flow', async ({ page }) => {
    // Generate a unique email for this test run
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    // STEP 1: Navigate to signup and create account
    await page.goto(`${BASE_URL}/signup`)
    await expect(page).toHaveTitle(/Create Account/i)

    // Fill signup form
    await page.fill('input[type="text"]', 'Test User')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)

    // Submit and wait for redirect
    await page.click('button:has-text("Create Account")')
    await page.waitForURL(`${BASE_URL}/onboarding`, { timeout: 10000 })

    // STEP 2: Complete onboarding (skip Plaid, add initial budget)
    await page.click('button:has-text("Skip")')
    await expect(page.locator('text=Create Your First Budget')).toBeVisible()

    // Add first budget in onboarding
    await page.click('input[placeholder*="Category"]')
    await page.fill('input[placeholder*="Category"]', 'Dining')
    await page.fill('input[placeholder*="Budget Limit"]', '300')
    await page.click('button:has-text("Create Budget")')

    // Should redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })

    // STEP 3: Add an expense from dashboard
    await page.click('button:has-text("Add Expense")')
    await expect(page.locator('text=Add New Expense')).toBeVisible()

    await page.fill('input[placeholder*="Amount"]', '25.50')
    await page.click('select, input[placeholder*="Category"]')
    await page.click('text=Dining', { strict: false })
    await page.fill('input[placeholder*="Description"]', 'Test expense')

    await page.click('button:has-text("Add Expense")')
    await page.waitForTimeout(1000) // Wait for modal to close

    // STEP 4: Verify expense appears on dashboard
    const expenseVisible = await page.locator('text=25.50').isVisible()
    expect(expenseVisible).toBe(true)

    // Verify dashboard shows updated balance
    const balanceCard = page.locator('[class*="card"]').filter({ hasText: /Total Balance|Total Spent/ })
    await expect(balanceCard).toBeVisible()

    // STEP 5: Navigate to Expenses page and verify it appears there
    await page.click('a:has-text("Expenses")')
    await page.waitForURL(`${BASE_URL}/expenses`, { timeout: 5000 })

    const expenseInList = page.locator('[class*="transaction"]').filter({ hasText: 'Test expense' })
    await expect(expenseInList).toBeVisible()

    // STEP 6: Logout
    await page.click('button, a:has-text("Settings")')
    await page.waitForURL(`${BASE_URL}/settings`, { timeout: 5000 })

    await page.click('button:has-text("Logout")')
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 })

    // STEP 7: Verify we're back at login page
    await expect(page).toHaveTitle(/Welcome back/i)

    // Try to access dashboard - should redirect to login
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 })
  })

  test('should not allow unauthenticated access to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 })
  })

  test('should prevent login with wrong password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')

    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(1000)

    // Should show error or remain on login page
    const errorVisible = await page.locator('[class*="error"], [class*="alert"]').isVisible().catch(() => false)
    const stillOnLogin = page.url().includes('/login')

    expect(errorVisible || stillOnLogin).toBe(true)
  })
})
