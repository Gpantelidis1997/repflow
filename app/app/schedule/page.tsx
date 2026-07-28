'use client'
import { useEffect,useState } from 'react'
import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/client'

type Event={id:string;workout_name:string;sequence_index:number;status:string;scheduled_for?:string;reason?:string}
export default function SchedulePage(){
 const [events,setEvents]=useState<Event[]>([]); const [loading,setLoading]=useState(true)
 useEffect(()=>{void load()},[])
 async function load(){const s=createClient();const {data:{user}}=await s.auth.getUser();if(user){const {data}=await s.from('workout_schedule_events').select('*').eq('user_id',user.id).order('sequence_index');setEvents((data??[]) as Event[])}setLoading(false)}
 async function update(id:string,status:'missed'|'skipped',reason:string){const s=createClient();await s.from('workout_schedule_events').update({status,reason,updated_at:new Date().toISOString()}).eq('id',id);await load()}
 return <main className="container"><AppNav/><div className="eyebrow">Workout sequence</div><h1>Schedule</h1><p className="muted">Missing one workout does not regenerate your programme. The training order remains intact.</p>{loading?<div className="card">Loading schedule…</div>:<div className="stack">{events.map((event,index)=><article className="card" key={event.id}><div className="row"><div><strong>{event.workout_name}</strong><div className="muted">Sequence {index+1}{event.scheduled_for?` • ${event.scheduled_for}`:''}</div></div><span className="pill">{event.status}</span></div>{event.status==='scheduled'&&<div className="action-row"><button className="btn btn-secondary" onClick={()=>update(event.id,'missed','Could not train')}>Mark Missed</button><button className="btn btn-secondary" onClick={()=>update(event.id,'skipped','Skipped intentionally')}>Skip Intentionally</button></div>}{event.reason&&<p className="muted">{event.reason}</p>}</article>)}{!events.length&&<div className="card empty">No scheduled workouts yet. Activate a programme to begin the sequence.</div>}</div>}</main>
}
