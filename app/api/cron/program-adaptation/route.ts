import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADAPTATION_ENGINE_VERSION, adaptationDedupeKey, proposeExerciseAdaptation, shouldAutoApply } from '@/lib/adaptation/engine'
import type { SetLog } from '@/lib/engine/progression'

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service configuration missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = serviceClient()
  const { data: sessions, error } = await db.from('workout_sessions')
    .select('id,user_id,program_id,completed_at,session_json')
    .eq('status','completed').not('completed_at','is',null)
    .gte('completed_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order('completed_at', { ascending: true }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let created = 0, applied = 0, reviewRequired = 0, skipped = 0
  for (const session of sessions ?? []) {
    const { data: logs } = await db.from('set_logs').select('exercise_id,load,reps,difficulty').eq('workout_session_id', session.id).order('set_number')
    const grouped = new Map<string, SetLog[]>()
    for (const row of logs ?? []) {
      if (!row.difficulty) continue
      const entries = grouped.get(row.exercise_id) ?? []
      entries.push({ load: Number(row.load), reps: row.reps, difficulty: row.difficulty as SetLog['difficulty'] })
      grouped.set(row.exercise_id, entries)
    }
    const targets = (session.session_json as any)?.exerciseTargets ?? {}
    for (const [exerciseId, exerciseLogs] of grouped) {
      const dedupeKey = adaptationDedupeKey(session.id, exerciseId)
      const { data: exists } = await db.from('adaptation_decisions').select('id').eq('dedupe_key', dedupeKey).maybeSingle()
      if (exists) { skipped++; continue }
      const target = targets[exerciseId] ?? { min: 8, max: 12 }
      const proposal = proposeExerciseAdaptation({ logs: exerciseLogs, minReps: Number(target.min ?? 8), maxReps: Number(target.max ?? 12), exerciseId })
      const autoApply = shouldAutoApply(proposal)
      const status = proposal.status === 'review_required' ? 'review_required' : autoApply ? 'applied' : 'proposed'
      const { error: insertError } = await db.from('adaptation_decisions').insert({
        user_id: session.user_id, program_id: session.program_id, workout_session_id: session.id, exercise_id: exerciseId,
        decision_type: proposal.decisionType, status, reason_code: proposal.reasonCode, explanation: proposal.explanation,
        confidence: proposal.confidence, previous_state: proposal.previousState, next_state: proposal.nextState,
        evidence: proposal.evidence, engine_version: ADAPTATION_ENGINE_VERSION, dedupe_key: dedupeKey,
        applied_at: autoApply ? new Date().toISOString() : null
      })
      if (insertError) continue
      created++
      if (status === 'applied') {
        applied++
        await db.from('progression_records').insert({
          user_id: session.user_id, workout_session_id: session.id, exercise_id: exerciseId,
          state: proposal.decisionType === 'increase_load' ? 'Increase' : proposal.decisionType === 'reduce_load' ? 'Reduce' : proposal.decisionType === 'build_reps' ? 'Build Reps' : 'Repeat',
          previous_load: Number((proposal.previousState as any).load ?? 0), next_load: Number((proposal.nextState as any).load ?? 0), target_text: proposal.explanation
        })
      } else if (status === 'review_required') {
        reviewRequired++
        await db.from('notifications').insert({ user_id: session.user_id, type: 'progress', title: 'Exercise needs attention', body: proposal.explanation, action_label: 'Review exercise', action_url: '/app/program', metadata: { adaptation_dedupe_key: dedupeKey } })
      }
    }
  }
  return NextResponse.json({ ok: true, created, applied, reviewRequired, skipped, engineVersion: ADAPTATION_ENGINE_VERSION })
}
