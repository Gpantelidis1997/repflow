import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'
import { eurosFromCents, healthLabel, percentage } from '@/lib/intelligence/founder'

export default async function FounderIntelligencePage() {
  const { supabase } = await requireAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const [snapshotResult, insightsResult, healthResult, subscriptionsResult] = await Promise.all([
    supabase.from('business_daily_snapshots').select('*').eq('snapshot_date', today).maybeSingle(),
    supabase.from('intelligence_insights').select('*').eq('status', 'open').order('last_seen_at', { ascending: false }).limit(8),
    supabase.from('system_health_checks').select('*').order('checked_at', { ascending: false }).limit(20),
    supabase.from('subscriptions').select('status,plan')
  ])

  const snapshot = snapshotResult.data
  const subscriptions = subscriptionsResult.data ?? []
  const active = snapshot?.active_subscribers ?? subscriptions.filter(s => s.status === 'active').length
  const trialing = snapshot?.trialing_subscribers ?? subscriptions.filter(s => s.status === 'trialing').length
  const paymentProblems = snapshot?.past_due_subscribers ?? subscriptions.filter(s => ['past_due','unpaid','incomplete'].includes(s.status)).length
  const paidBase = active + trialing

  const latestHealth = new Map<string, any>()
  for (const check of healthResult.data ?? []) if (!latestHealth.has(check.service)) latestHealth.set(check.service, check)

  return <main className="container founder-shell">
    <div className="founder-header">
      <div><p className="eyebrow">RepFlow Founder Mode</p><h1>Today&apos;s snapshot</h1><p className="muted">Only the numbers and alerts that may require your attention.</p></div>
      <span className={`system-badge ${paymentProblems ? 'warning' : 'healthy'}`}>{paymentProblems ? 'Attention needed' : 'Operating normally'}</span>
    </div>

    <section className="founder-metrics">
      <article className="founder-metric"><span>Estimated MRR</span><strong>{eurosFromCents(snapshot?.estimated_mrr_cents)}</strong><small>Based on active plans</small></article>
      <article className="founder-metric"><span>Active subscribers</span><strong>{active}</strong><small>{trialing} currently trialing</small></article>
      <article className="founder-metric"><span>Payment health</span><strong>{percentage(paidBase - paymentProblems, paidBase)}</strong><small>{paymentProblems} need automatic retry</small></article>
      <article className="founder-metric"><span>Workouts today</span><strong>{snapshot?.completed_workouts ?? 0}</strong><small>{snapshot?.generated_programs ?? 0} programs generated</small></article>
    </section>

    <section className="grid founder-grid">
      <article className="card founder-panel">
        <div className="row"><div><p className="eyebrow">Intelligence</p><h2>What matters today</h2></div><span className="pill">{insightsResult.data?.length ?? 0} open</span></div>
        <div className="insight-list">
          {(insightsResult.data ?? []).map(insight => <div className={`insight insight-${insight.severity}`} key={insight.id}>
            <div><strong>{insight.title}</strong><p>{insight.body}</p>{insight.recommendation && <small>{insight.recommendation}</small>}</div>
            <span>{insight.category}</span>
          </div>)}
          {!insightsResult.data?.length && <div className="empty-state"><strong>No action required.</strong><p className="muted">RepFlow will surface only meaningful exceptions here.</p></div>}
        </div>
      </article>

      <article className="card founder-panel">
        <p className="eyebrow">Platform health</p><h2>Core services</h2>
        <div className="service-list">
          {['database','stripe','email','program-engine'].map(service => {
            const check = latestHealth.get(service)
            return <div className="service-row" key={service}><span><i className={`health-dot ${check?.status ?? 'unknown'}`} />{service.replace('-', ' ')}</span><strong>{healthLabel(check?.status)}</strong></div>
          })}
        </div>
        <p className="muted service-note">Missing checks remain “Unknown” rather than presenting a false healthy state.</p>
      </article>
    </section>

    <section className="card founder-panel founder-secondary">
      <div><p className="eyebrow">Automatic operations</p><h2>Your role stays small</h2><p className="muted">Payments retry through Stripe, programs adapt through the engine, and this page highlights only exceptions.</p></div>
      <div className="action-row"><Link className="btn btn-primary button-link" href="/app/admin/automation">Automation</Link><Link className="btn btn-secondary button-link" href="/app/admin/operations">Operations</Link><Link className="btn btn-secondary button-link" href="/app/admin/audit">Audit</Link><Link className="btn btn-secondary button-link" href="/app/admin">Admin home</Link></div>
    </section>
  </main>
}
