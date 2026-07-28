import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export default async function AdminExercises({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login');
 const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single(); if(!['admin','super_admin'].includes(profile?.role)) redirect('/app/page');
 const sp=await searchParams; let query=supabase.from('exercises').select('*').order('exercise_name');
 if(sp.q) query=query.ilike('exercise_name',`%${sp.q}%`); if(sp.status==='active') query=query.eq('active',true); if(sp.status==='inactive') query=query.eq('active',false);
 const {data:exercises}=await query.limit(200);
 return <main className="container"><div className="row"><div><p className="eyebrow">Admin</p><h1>Exercise Library</h1></div><Link className="btn btn-secondary button-link" href="/app/page">Exit Admin</Link></div>
 <form className="card admin-filters"><input className="input" name="q" defaultValue={sp.q} placeholder="Search exercises"/><select className="input" name="status" defaultValue={sp.status??'all'}><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button className="btn btn-primary">Filter</button></form>
 <div className="table-wrap"><table className="admin-table"><thead><tr><th>Exercise</th><th>Pattern</th><th>Equipment</th><th>Difficulty</th><th>Status</th></tr></thead><tbody>{(exercises??[]).map((e:any)=><tr key={e.exercise_id}><td><strong>{e.exercise_name}</strong><div className="muted">{e.exercise_role}</div></td><td>{e.movement_pattern}</td><td>{e.equipment.join?.(', ')??e.equipment}</td><td>{e.difficulty_level}</td><td><span className={e.active?'pill pill-success':'pill'}>{e.active?'Active':'Inactive'}</span></td></tr>)}</tbody></table></div></main>
}
