import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'
import { automationStatusLabel, automationTone } from '@/lib/automation/operations'

export default async function AutomationPage() {
  const { supabase } = await requireAdmin()
  const [rulesResult, jobsResult, runsResult, incidentsResult] = await Promise.all([
    supabase.from('automation_rules').select('*').order('name'),
    supabase.from('automation_jobs').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('automation_runs').select('*').order('started_at', { ascending: false }).limit(8),
    supabase.from('operational_incidents').select('*').in('status', ['open','monitoring']).order('last_seen_at', { ascending: false }).limit(10)
  ])
  const jobs = jobsResult.data ?? []
  const failed = jobs.filter(job => job.status === 'failed').length
  const queued = jobs.filter(job => job.status === 'queued').length

  return <main className="container founder-shell">
    <div className="founder-header"><div><p className="eyebrow">RepFlow Autonomous Operations</p><h1>Automation control</h1><p className="muted">Observe exceptions and execution history without managing daily user activity.</p></div><span className={`system-badge ${failed ? 'warning' : 'healthy'}`}>{failed ? `${failed} failed jobs` : 'Automation normal'}</span></div>

    <section className="founder-metrics">
      <article className="founder-metric"><span>Enabled rules</span><strong>{(rulesResult.data ?? []).filter(rule => rule.enabled).length}</strong><small>{rulesResult.data?.length ?? 0} configured</small></article>
      <article className="founder-metric"><span>Queued jobs</span><strong>{queued}</strong><small>Processed automatically</small></article>
      <article className="founder-metric"><span>Failed jobs</span><strong>{failed}</strong><small>Only terminal failures</small></article>
      <article className="founder-metric"><span>Open incidents</span><strong>{incidentsResult.data?.length ?? 0}</strong><small>Founder attention only when needed</small></article>
    </section>

    <section className="grid founder-grid">
      <article className="card founder-panel"><p className="eyebrow">Rules</p><h2>What RepFlow handles</h2><div className="automation-rule-list">{(rulesResult.data ?? []).map(rule => <div className="automation-rule" key={rule.key}><div><strong>{rule.name}</strong><p>{rule.description}</p></div><span className={rule.enabled ? 'pill pill-success' : 'pill'}>{rule.enabled ? rule.cadence : 'Disabled'}</span></div>)}</div></article>
      <article className="card founder-panel"><p className="eyebrow">Incidents</p><h2>Needs attention</h2><div className="insight-list">{(incidentsResult.data ?? []).map(item => <div className={`insight insight-${item.severity}`} key={item.id}><div><strong>{item.title}</strong><p>{item.detail}</p></div><span>{item.service}</span></div>)}{!incidentsResult.data?.length && <div className="empty-state"><strong>No open incidents.</strong><p className="muted">Normal user activity is intentionally hidden.</p></div>}</div></article>
    </section>

    <section className="card founder-panel automation-history"><div className="row"><div><p className="eyebrow">Execution history</p><h2>Recent jobs</h2></div><span className="pill">Latest 25</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Job</th><th>Status</th><th>Attempts</th><th>Created</th></tr></thead><tbody>{jobs.map(job => <tr key={job.id}><td><strong>{job.job_type.replaceAll('_',' ')}</strong><div className="muted">{job.rule_key}</div></td><td><span className={`pill ${automationTone(job.status)}`}>{automationStatusLabel(job.status)}</span></td><td>{job.attempts}/{job.max_attempts}</td><td>{new Date(job.created_at).toLocaleString('el-GR')}</td></tr>)}</tbody></table></div></section>

    <section className="card founder-panel founder-secondary"><div><p className="eyebrow">Founder workload</p><h2>Exception-only operation</h2><p className="muted">Stripe performs payment retries. RepFlow creates in-app notices, retries failed jobs with backoff, and escalates only terminal failures.</p></div><div className="action-row"><Link className="btn btn-primary button-link" href="/app/admin/intelligence">Founder dashboard</Link><Link className="btn btn-secondary button-link" href="/app/admin">Admin home</Link></div></section>
  </main>
}
