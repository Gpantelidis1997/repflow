import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/server'

export default async function Progress(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  const {data}=user?await supabase.from('progression_records').select('exercise_id,state,next_load,target_text,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30):{data:[]}
  return <main className="container"><AppNav/><div className="eyebrow">Progress</div><h1>Your next targets</h1><div className="stack">{!data?.length?<div className="card"><p className="muted">Progression records will appear here after completed workouts.</p></div>:data.map((record:any,index:number)=><div className="card" key={`${record.exercise_id}-${index}`}><div className="row"><strong>{record.exercise_id.replaceAll('_',' ')}</strong><span className="pill">{record.state}</span></div><p>{record.target_text}</p><small className="muted">{new Date(record.created_at).toLocaleDateString()}</small></div>)}</div></main>
}
