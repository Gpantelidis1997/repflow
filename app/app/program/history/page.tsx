import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/server'

export default async function ProgramHistoryPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  const {data:programs}=user?await supabase.from('programs').select('id,version,status,split,change_reason,created_at,activated_at,parent_program_id').eq('user_id',user.id).order('version',{ascending:false}):{data:[]}
  return <main className="container"><AppNav/><div className="eyebrow">Program history</div><h1>Version timeline</h1><p className="muted">Every major adjustment creates a new version without changing past workout records.</p><div className="timeline">{(programs??[]).map((program:any)=><article className="card timeline-item" key={program.id}><div className="row"><div><strong>Version {program.version}</strong><div className="muted">{program.split}</div></div><span className={`pill ${program.status==='active'?'pill-success':''}`}>{program.status}</span></div><p>{program.change_reason||'Initial programme'}</p><small className="muted">{new Date(program.activated_at||program.created_at).toLocaleDateString('en-GB')}</small></article>)}</div>{!programs?.length&&<div className="card empty">No programme versions are available yet.</div>}</main>
}
