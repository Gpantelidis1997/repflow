import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildWeeklySummary } from '@/lib/lifecycle/summary'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const [{ data: sessions }, { count: setCount }, { count: progressionCount }] = await Promise.all([
    supabase.from('workout_sessions').select('status').eq('user_id', user.id).gte('created_at', since),
    supabase.from('set_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since),
    supabase.from('progression_records').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
  ])
  const rows = sessions ?? []
  const summary = buildWeeklySummary({ scheduled: rows.length, completed: rows.filter(x => x.status === 'completed').length, partial: rows.filter(x => x.status === 'partial').length, totalSets: setCount ?? 0, personalBests: progressionCount ?? 0 })
  await supabase.from('notifications').insert({ user_id: user.id, type: 'weekly_summary', title: summary.headline, body: summary.body, action_label: 'View progress', action_url: '/app/progress', metadata: summary })
  return NextResponse.json(summary)
}
