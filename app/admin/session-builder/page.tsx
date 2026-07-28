import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'

export default async function SessionBuilderPage(){
 const {supabase}=await requireAdmin()
 const [{count:runs},{count:publishable},latest]=await Promise.all([
  supabase.from('session_generation_runs').select('*',{count:'exact',head:true}),
  supabase.from('session_generation_runs').select('*',{count:'exact',head:true}).eq('publishable',true),
  supabase.from('session_generation_runs').select('id,constraints,overall_score,estimated_minutes,publishable,engine_version,created_at').order('created_at',{ascending:false}).limit(20)
 ])
 const rows=latest.data??[]
 const passRate=(runs??0)>0?Math.round(((publishable??0)/(runs??1))*100):0
 return <main className="container founder-shell">
  <div className="founder-header"><div><p className="eyebrow">V14B Generation Core</p><h1>Session Builder</h1><p className="muted">Movement slots, ranked exercise selection, time control and publishability validation.</p></div><Link className="btn btn-secondary button-link" href="/app/admin">Admin home</Link></div>
  <section className="founder-metrics"><article className="founder-metric"><span>Generation runs</span><strong>{runs??0}</strong><small>Audited previews</small></article><article className="founder-metric"><span>Publishable</span><strong>{publishable??0}</strong><small>Score ≥85, no errors</small></article><article className="founder-metric"><span>Pass rate</span><strong>{passRate}%</strong><small>Catalogue readiness</small></article><article className="founder-metric"><span>Engine</span><strong>V1</strong><small>Deterministic builder</small></article></section>
  <section className="card founder-panel"><div className="row"><div><p className="eyebrow">Generation pipeline</p><h2>How a session is assembled</h2></div><span className="pill">No black box</span></div><div className="builder-flow"><span>Constraints</span><b>→</b><span>Movement slots</span><b>→</b><span>Exercise ranking</span><b>→</b><span>Time trimming</span><b>→</b><span>Quality score</span></div><p className="muted">Required slots may never be silently removed. Optional accessories can be trimmed when the session exceeds the requested duration.</p></section>
  <section className="card founder-panel founder-secondary"><div><p className="eyebrow">Current capability</p><h2>Session-level generation is ready</h2><p className="muted">The engine can build upper, lower, full-body, push and pull sessions for hypertrophy, strength or general fitness constraints.</p></div><div className="action-row"><Link className="btn btn-primary button-link" href="/app/admin/exercise-intelligence">Exercise intelligence</Link><Link className="btn btn-secondary button-link" href="/app/admin/adaptation">Adaptation engine</Link></div></section>
  <section className="card founder-panel"><div className="row"><div><p className="eyebrow">Audit trail</p><h2>Recent generation attempts</h2></div><span className="pill">Latest 20</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Focus</th><th>Goal</th><th>Duration</th><th>Score</th><th>Status</th><th>Engine</th></tr></thead><tbody>{rows.length?rows.map((run:any)=><tr key={run.id}><td>{String(run.constraints?.focus??'—').replace('_',' ')}</td><td>{run.constraints?.goal??'—'}</td><td>{run.estimated_minutes} min</td><td><strong>{Math.round(run.overall_score)}</strong></td><td><span className={run.publishable?'pill pill-success':'pill pill-danger'}>{run.publishable?'Publishable':'Rejected'}</span></td><td>{run.engine_version}</td></tr>):<tr><td colSpan={6} className="empty">No generation runs yet. Use the preview API after migration 015 is applied.</td></tr>}</tbody></table></div></section>
 </main>
}
