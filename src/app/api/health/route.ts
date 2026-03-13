import { NextResponse } from 'next/server'

const GET = async () => {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
  }

  const isHealthy = checks.openai === 'configured'

  return NextResponse.json(checks, { status: isHealthy ? 200 : 503 })
}

export { GET }
