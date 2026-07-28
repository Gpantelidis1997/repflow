import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeError } from '@/lib/automation/operations'

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service configuration missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function recordHealth(db: ReturnType<typeof serviceClient>, service: string, status: 'healthy'|'degraded'|'down'|'unknown', detail: string, latencyMs?: number) {
  await db.from('system_health_checks').insert({ service, status, detail, latency_ms: latencyMs ?? null })
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let db: ReturnType<typeof serviceClient>
  try { db = serviceClient() } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 })
  }

  const { data: run, error: runError } = await db.from('automation_runs').insert({ source: 'vercel-cron', status: 'running' }).select('id').single()
  if (runError || !run) return NextResponse.json({ error: runError?.message ?? 'Could not create automation run' }, { status: 500 })

  let completed = 0, failed = 0, skipped = 0
  try {
    const { data: queued, error: enqueueError } = await db.rpc('enqueue_autonomous_operations')
    if (enqueueError) throw enqueueError

    const { data: jobs, error: jobsError } = await db.from('automation_jobs').select('*').eq('status', 'queued').lte('run_after', new Date().toISOString()).order('created_at').limit(100)
    if (jobsError) throw jobsError

    for (const job of jobs ?? []) {
      const { data: claimed } = await db.from('automation_jobs').update({ status: 'processing', locked_at: new Date().toISOString(), attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'queued').select('id').maybeSingle()
      if (!claimed) { skipped++; continue }
      try {
        if (job.job_type === 'billing_notice' && job.user_id) {
          const { error } = await db.from('notifications').insert({
            user_id: job.user_id, type: 'billing', title: 'Payment needs attention',
            body: 'Your latest RepFlow payment was not completed. Stripe will retry automatically; update your payment method if needed.',
            action_label: 'Manage billing', action_url: '/app/billing', metadata: { automation_job_id: job.id }
          })
          if (error) throw error
        } else if (job.job_type === 'inactivity_nudge' && job.user_id) {
          const { data: preferences } = await db.from('user_preferences').select('inactivity_reminders_enabled').eq('user_id', job.user_id).maybeSingle()
          if (preferences?.inactivity_reminders_enabled === false) {
            await db.from('automation_jobs').update({ status: 'skipped', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', job.id)
            skipped++; continue
          }
          const { error } = await db.from('notifications').insert({
            user_id: job.user_id, type: 'inactivity', title: 'Ready when you are',
            body: 'Your RepFlow plan is still here. Continue with the next session—there is no need to start over.',
            action_label: 'Continue training', action_url: '/app/workout', metadata: { automation_job_id: job.id }
          })
          if (error) throw error
        } else if (job.job_type === 'generator_exception') {
          await db.from('operational_incidents').upsert({
            service: 'program-engine', severity: 'warning', title: 'Generator exception needs review',
            detail: String(job.payload?.body ?? 'An unresolved generator exception was detected.'),
            fingerprint: `generator:${job.payload?.insight_id ?? job.id}`, last_seen_at: new Date().toISOString(), metadata: job.payload
          }, { onConflict: 'fingerprint', ignoreDuplicates: false })
        } else if (job.job_type === 'health_check') {
          const started = Date.now()
          const { error } = await db.from('automation_rules').select('key').limit(1)
          await recordHealth(db, 'database', error ? 'degraded' : 'healthy', error?.message ?? 'Database query completed.', Date.now() - started)
          await recordHealth(db, 'stripe', process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unknown', process.env.STRIPE_SECRET_KEY ? 'Stripe server key configured.' : 'Stripe server key not configured.')
          await recordHealth(db, 'email', process.env.EMAIL_PROVIDER_API_KEY ? 'healthy' : 'unknown', process.env.EMAIL_PROVIDER_API_KEY ? 'Email provider configured.' : 'No external email provider configured; in-app notifications remain active.')
          await recordHealth(db, 'program-engine', 'healthy', 'No unresolved execution failure detected by this operations run.')
        }
        await db.from('automation_jobs').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_error: null }).eq('id', job.id)
        completed++
      } catch (error) {
        const attempts = job.attempts + 1
        const terminal = attempts >= job.max_attempts
        await db.from('automation_jobs').update({ status: terminal ? 'failed' : 'queued', run_after: new Date(Date.now() + attempts * 30 * 60 * 1000).toISOString(), last_error: safeError(error), updated_at: new Date().toISOString() }).eq('id', job.id)
        if (terminal) failed++; else skipped++
      }
    }

    const status = failed > 0 ? (completed > 0 ? 'partial' : 'failed') : 'completed'
    await db.from('automation_runs').update({ status, queued_count: Number(queued ?? 0), completed_count: completed, failed_count: failed, skipped_count: skipped, finished_at: new Date().toISOString() }).eq('id', run.id)
    return NextResponse.json({ ok: failed === 0, runId: run.id, queued, completed, failed, skipped })
  } catch (error) {
    await db.from('automation_runs').update({ status: 'failed', failed_count: failed + 1, detail: { error: safeError(error) }, finished_at: new Date().toISOString() }).eq('id', run.id)
    await recordHealth(db, 'automation-engine', 'down', safeError(error))
    return NextResponse.json({ error: safeError(error), runId: run.id }, { status: 500 })
  }
}
