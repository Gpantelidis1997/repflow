import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const started = Date.now()
  const { data, error } = await supabase.rpc('refresh_founder_snapshot')
  await supabase.from('system_health_checks').insert({
    service: 'database', status: error ? 'degraded' : 'healthy', latency_ms: Date.now() - started,
    detail: error?.message ?? 'Founder snapshot refreshed successfully.'
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, snapshot: data })
}
