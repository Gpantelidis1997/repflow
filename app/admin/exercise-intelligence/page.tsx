import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'
export default async function ExerciseIntelligencePage(){
 const {supabase}=await requireAdmin()
 const [{count:all},{count:enabled},{count:taxonomy},{count:compatibility},{count:flags},sample]=await Promise.all([
  supabase.from('exercises').select('*',{count:'exact',head:true}),
  supabase.from('exercises').select('*',{count:'exact',head:true}).eq('generator_enabled',true).eq('active',true),
  supabase.from('movement_taxonomy').select('*',{count:'exact',head:true}),
  supabase.from('exercise_compatibility').select('*',{count:'exact',head:true}),
  supabase.from('exercise_quality_flags').select('*',{count:'exact',head:true}).is('resolved_at',null),
  supabase.from('exercises').select('exercise_id,exercise_name,movement_family,equipment,difficulty_level,fatigue_cost,duplicate_cluster,smart_tags').eq('generator_enabled',true).order('exercise_name').limit(50)
 ])
 return <main className="container founder-shell">
  <div className="founder-header"><div><p className="eyebrow">V14A Foundation</p><h1>Exercise Intelligence</h1><p className="muted">Taxonomy, metadata quality and generator readiness—not manual coaching.</p></div><Link className="btn btn-secondary button-link" href="/app/admin">Admin home</Link></div>
  <section className="founder-metrics"><article className="founder-metric"><span>Exercises</span><strong>{all??0}</strong><small>{enabled??0} generator enabled</small></article><article className="founder-metric"><span>Movement nodes</span><strong>{taxonomy??0}</strong><small>Versioned taxonomy</small></article><article className="founder-metric"><span>Compatibility links</span><strong>{compatibility??0}</strong><small>Ranked alternatives</small></article><article className="founder-metric"><span>Quality flags</span><strong>{flags??0}</strong><small>Open metadata issues</small></article></section>
  <section className="card founder-panel"><div className="row"><div><p className="eyebrow">Generator catalogue</p><h2>Ready exercises</h2></div><span className="pill">Latest 50</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Exercise</th><th>Movement</th><th>Equipment</th><th>Difficulty</th><th>Fatigue</th><th>Cluster</th></tr></thead><tbody>{(sample.data??[]).map((e:any)=><tr key={e.exercise_id}><td><strong>{e.exercise_name}</strong><div className="muted">{(e.smart_tags??[]).slice(0,3).join(' · ')}</div></td><td>{e.movement_family??'Unmapped'}</td><td>{(e.equipment??[]).join(', ')}</td><td>{e.difficulty_level}/4</td><td>{e.fatigue_cost}/5</td><td>{e.duplicate_cluster??'—'}</td></tr>)}</tbody></table></div></section>
  <section className="card founder-panel founder-secondary"><div><p className="eyebrow">Foundation status</p><h2>Structured before scaled</h2><p className="muted">This release upgrades the existing catalogue and ranking model. The 1,000+ exercise target should be reached through reviewed batches, not synthetic bulk rows with weak metadata.</p></div><div className="action-row"><Link className="btn btn-primary button-link" href="/app/admin/exercises">Exercise library</Link><Link className="btn btn-secondary button-link" href="/app/admin/adaptation">Adaptation log</Link></div></section>
 </main>
}