'use server'

import { NextRequest, NextResponse } from 'next/server'

// Manual trigger endpoint for testing weekly summary emails
// Usage: POST /api/cron/weekly-summary/test with body: { "secret": "your-cron-secret" }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { secret } = body

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Import and call the GET handler from the main cron route
    const { GET } = await import('@/app/api/cron/weekly-summary/route')
    const mockRequest = new Request('http://localhost:3000/api/cron/weekly-summary', {
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    }) as NextRequest

    return await GET(mockRequest)
  } catch (error) {
    console.error('Test trigger error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
