# FinTrack — Manual Deployment Test Checklist

## Prerequisites
Before testing, ensure:
1. `RESEND_API_KEY` is set in Vercel environment variables
2. `CRON_SECRET` is set in Vercel environment variables  
3. Production Google OAuth callback URL is registered: `https://your-domain.vercel.app/api/auth/callback/google`
4. App is deployed and live on Vercel

## Test Script (run locally with dev server)

```bash
# 1. Start dev server
pnpm dev

# 2. Open browser to http://localhost:3000
# 3. Follow the checklist below
```

---

## Step-by-Step Test Checklist

### Step 1: Landing Page
- [ ] Hard refresh (Ctrl+Shift+R) on http://localhost:3000
- [ ] Confirm no console errors (F12 → Console tab)
- [ ] Confirm landing page renders with "FinTrack" branding
- **Result**: PASS / FAIL

### Step 2: Sign Up
- [ ] Click "Get Started" or navigate to /signup
- [ ] Fill in: Name, Email (use test-YYYYMMDD@example.com), Password (min 8 chars)
- [ ] Submit form
- [ ] Confirm redirect to /onboarding or /dashboard
- [ ] Confirm no error page shown
- **Result**: PASS / FAIL

### Step 3: Google OAuth (Production Only)
- [ ] Navigate to /login
- [ ] Click "Continue with Google"
- [ ] Complete Google sign-in with real Google account
- [ ] Confirm callback succeeds (redirects back to app)
- [ ] Confirm you're logged in
- **Result**: PASS / FAIL
- **Note**: If this fails, check Google Cloud Console for correct callback URL

### Step 4: Add Data
- [ ] Navigate to /expenses
- [ ] Click "Add Expense"
- [ ] Fill: Amount ($25.50), Category (Dining), Description (Test lunch), Date (today)
- [ ] Submit
- [ ] Navigate to /budgets
- [ ] Click "Add Budget"
- [ ] Fill: Category (Dining), Limit ($500), Month (current month)
- [ ] Submit
- [ ] Navigate to /income (or use onboarding)
- [ ] Add income entry if possible
- [ ] **Hard refresh** (Ctrl+Shift+R) on /expenses
- [ ] Confirm the expense is still there
- [ ] **Hard refresh** on /budgets
- [ ] Confirm the budget is still there
- **Result**: PASS / FAIL

### Step 5: Notification Preferences
- [ ] Navigate to /settings
- [ ] Find "Weekly Summary" checkbox
- [ ] Toggle it ON (should be enabled, not "Coming soon")
- [ ] **Hard refresh** on /settings
- [ ] Confirm Weekly Summary is still checked
- [ ] Confirm Budget Alerts and AI Insights are disabled with "(Coming soon)" label
- **Result**: PASS / FAIL

### Step 6: Command Palette
- [ ] Press Ctrl+K (or Cmd+K on Mac)
- [ ] Confirm command palette opens
- [ ] Type "Expenses" in search box
- [ ] Confirm filtered results appear
- [ ] Click "Expenses" or press Enter
- [ ] Confirm navigation to /expenses works
- [ ] Press Ctrl+K again, press Escape
- [ ] Confirm palette closes
- **Result**: PASS / FAIL

### Step 7: Dashboard Sparklines
- [ ] Navigate to /dashboard
- [ ] Look at the three summary cards (Balance, Income, Expenses)
- [ ] Confirm each card has a small sparkline chart (mini trend line)
- [ ] Confirm sparklines show data points (not empty/broken SVGs)
- [ ] If you only have data from Step 4, sparklines may be minimal — that's OK
- **Result**: PASS / FAIL

### Step 8: System Theme
- [ ] Navigate to /dashboard
- [ ] Click the theme toggle button (top right, next to "FinTrack")
- [ ] Confirm dropdown appears with Light, Dark, System options
- [ ] Select "System"
- [ ] Change your OS preference (Windows: Settings → Personalization → Colors → Dark/Light)
- [ ] Confirm the app theme follows OS preference
- [ ] Refresh page — confirm System theme persists
- **Result**: PASS / FAIL

### Step 9: Weekly Summary Cron (Production Only)
- [ ] Open terminal
- [ ] Run: `curl -X GET https://your-domain.vercel.app/api/cron/weekly-summary -H "Authorization: Bearer YOUR_CRON_SECRET"`
- [ ] OR use the test endpoint: `curl -X POST https://your-domain.vercel.app/api/cron/weekly-summary/test -H "Content-Type: application/json" -d '{"secret":"YOUR_CRON_SECRET"}'`
- [ ] Confirm response: `{"success":true,"emailsSent":N}` where N >= 1
- [ ] Check email inbox for the weekly summary email
- [ ] Confirm email has correct subject: "Your Weekly Spending Summary — YYYY-MM-DD to YYYY-MM-DD"
- [ ] Confirm email body shows real spending data from Step 4
- **Result**: PASS / FAIL

### Step 10: Logout
- [ ] Navigate to /settings (or wherever logout button is)
- [ ] Click "Log Out"
- [ ] Confirm redirect to /login
- [ ] Try navigating directly to http://localhost:3000/dashboard
- [ ] Confirm you're redirected back to /login (not shown dashboard)
- **Result**: PASS / FAIL

---

## Report Format

After running all steps, report:

```
PART 3 DEPLOYMENT TEST RESULTS
===============================
Step 1 (Landing Page): PASS/FAIL — [details]
Step 2 (Sign Up): PASS/FAIL — [details]
Step 3 (Google OAuth): PASS/FAIL — [details]
Step 4 (Add Data): PASS/FAIL — [details]
Step 5 (Notification Preferences): PASS/FAIL — [details]
Step 6 (Command Palette): PASS/FAIL — [details]
Step 7 (Dashboard Sparklines): PASS/FAIL — [details]
Step 8 (System Theme): PASS/FAIL — [details]
Step 9 (Weekly Summary Cron): PASS/FAIL — [details]
Step 10 (Logout): PASS/FAIL — [details]

OVERALL: X/10 PASSED
```

If any step fails, provide:
- What you expected
- What actually happened
- Any error messages from console/network tab
