import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WeeklySummaryData {
  userName: string
  userEmail: string
  totalSpent: number
  totalIncome: number
  topCategories: Array<{ category: string; amount: number }>
  budgetAlerts: Array<{ category: string; spent: number; limit: number }>
  period: string
}

export async function sendWeeklySummary(data: WeeklySummaryData) {
  const { userName, userEmail, totalSpent, totalIncome, topCategories, budgetAlerts, period } = data

  const balance = totalIncome - totalSpent
  const balanceColor = balance >= 0 ? '#22C55E' : '#EF4444'

  const categoryRows = topCategories
    .map(cat => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${cat.category}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${cat.amount.toFixed(2)}</td></tr>`)
    .join('')

  const budgetRows = budgetAlerts
    .map(b => {
      const pct = Math.round((b.spent / b.limit) * 100)
      const color = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#22C55E'
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${b.category}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${b.spent.toFixed(2)} / $${b.limit.toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color}">${pct}%</td></tr>`
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc">
  <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="text-align:center;margin-bottom:24px">
      <h1 style="margin:0;font-size:24px;color:#0f172a">FinTrack Weekly Summary</h1>
      <p style="margin:8px 0 0;color:#64748b;font-size:14px">${period}</p>
    </div>

    <p style="color:#334155;font-size:15px">Hi ${userName},</p>
    <p style="color:#334155;font-size:15px">Here's your spending summary for the week:</p>

    <div style="display:flex;gap:16px;margin:24px 0">
      <div style="flex:1;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Spent</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#EF4444">$${totalSpent.toFixed(2)}</p>
      </div>
      <div style="flex:1;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Income</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#22C55E">$${totalIncome.toFixed(2)}</p>
      </div>
      <div style="flex:1;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase">Balance</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:${balanceColor}">$${balance.toFixed(2)}</p>
      </div>
    </div>

    ${topCategories.length > 0 ? `
    <h2 style="font-size:16px;color:#0f172a;margin:24px 0 12px">Top Spending Categories</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left;font-weight:600;color:#64748b">Category</th><th style="padding:8px 12px;text-align:right;font-weight:600;color:#64748b">Amount</th></tr></thead>
      <tbody>${categoryRows}</tbody>
    </table>
    ` : ''}

    ${budgetAlerts.length > 0 ? `
    <h2 style="font-size:16px;color:#0f172a;margin:24px 0 12px">Budget Status</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left;font-weight:600;color:#64748b">Category</th><th style="padding:8px 12px;text-align:right;font-weight:600;color:#64748b">Spent / Limit</th><th style="padding:8px 12px;text-align:right;font-weight:600;color:#64748b">Status</th></tr></thead>
      <tbody>${budgetRows}</tbody>
    </table>
    ` : ''}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Sent by FinTrack · <a href="${process.env.BETTER_AUTH_URL || 'https://fintrack.vercel.app'}" style="color:#6366f1">View Dashboard</a></p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: 'FinTrack <onboarding@resend.dev>',
    to: userEmail,
    subject: `Your Weekly Spending Summary — ${period}`,
    html,
  })
}
