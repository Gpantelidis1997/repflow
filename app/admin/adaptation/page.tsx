import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'

export default async function AdaptationPage() {
  const { supabase } = await requireAdmin()
  const [policiesResult, decisionsResult] = await Promise.all([
    supabase.from('adaptation_policies').select('*').order('name'),
    supabase.from('adaptation_decisions').select('*').order('created_at', { ascending: false }).limit(50)
  ])
  const decisions = decisionsResult.data ?? []
  const applied = decisions.filter(x => x.status === 'applied').length
  const reviews = decisions.filter(x => x.status === 'review_required').length
  const average = decisions.length ? decisions.reduce((sum,x)=>sum + Number(x.confidence),0) / decisions.length : 0

  return <main className="container founder-shell">
    <div className="founder-header"><div><p className="eyebrow">RepFlow Adaptation Engine</p><h1>Autonomous program decisions</h1><p className="muted">Review algorithm quality and exceptions—not individual coaching.</p></div><span className={`system-badge ${reviews ? 'warning' : 'healthy'}`}>{reviews ? `${reviews} reviews required` : 'Engine normal'}</span></div>
    <section className="founder-metrics">
      <article className="founder-metric"><span>Enabled policies</span><strong>{(policiesResult.data ?? []).filter(x=>x.enabled).length}</strong><small>Guardrails active</small></article>
      <article className="founder-metric"><span>Applied decisions</span><strong>{applied}</strong><small>Latest 50 decisions</small></article>
      <article className="founder-metric"><span>Manual reviews</span><strong>{reviews}</strong><small>Pain and low-confidence cases</small></article>
      <article className="founder-metric"><span>Average confidence</span><strong>{Math.round(average*100)}%</strong><small>Decision confidence</small></article>
    </section>
    <section className="grid founder-grid">
      <article className="card founder-panel"><p className="eyebrow">Safety policies</p><h2>Automatic limits</h2><div className="automation-rule-list">{(policiesResult.data ?? []).map(policy=><div className="automation-rule" key={policy.key}><div><strong>{policy.name}</strong><p>{policy.description}</p></div><span className={policy.enabled?'pill pill-success':'pill'}>{policy.enabled?`${Math.round(Number(policy.min_confidence)*100)}% min`:'Disabled'}</span></div>)}</div></article>
      <article className="card founder-panel"><p className="eyebrow">Engine principle</p><h2>Safe by default</h2><p className="muted">Load and rep changes may apply automatically. Pain reports, exercise replacement and full program regeneration are never silently applied.</p></article>
    </section>
    <section className="card founder-panel"><div className="row"><div><p className="eyebrow">Decision log</p><h2>Recent adaptations</h2></div><span className="pill">Engine v1.0.0</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Decision</th><th>Status</th><th>Confidence</th><th>Reason</th><th>Created</th></tr></thead><tbody>{decisions.map(item=><tr key={item.id}><td><strong>{item.decision_type.replaceAll('_',' ')}</strong><div className="muted">{item.explanation}</div></td><td><span className={`pill ${item.status==='applied'?'pill-success':item.status==='review_required'?'pill-warning':''}`}>{item.status.replaceAll('_',' ')}</span></td><td>{Math.round(Number(item.confidence)*100)}%</td><td>{item.reason_code.replaceAll('_',' ')}</td><td>{new Date(item.created_at).toLocaleString('el-GR')}</td></tr>)}</tbody></table></div></section>
    <div className="action-row"><Link className="btn btn-primary button-link" href="/app/admin/intelligence">Founder dashboard</Link><Link className="btn btn-secondary button-link" href="/app/admin/automation">Automation</Link></div>
  </main>
}
