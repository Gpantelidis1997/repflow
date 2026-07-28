import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/server'
import { onboardingPercent, onboardingSteps } from '@/lib/lifecycle/onboarding'
import Link from 'next/link'

export default async function Dashboard(){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
  const [{data:assessment},{data:program},{data:completed},{count:unread}] = user ? await Promise.all([
    supabase.from('assessments').select('id').eq('user_id',user.id).limit(1).maybeSingle(),
    supabase.from('programs').select('program_json').eq('user_id',user.id).eq('status','active').maybeSingle(),
    supabase.from('workout_sessions').select('id').eq('user_id',user.id).eq('status','completed').limit(1).maybeSingle(),
    supabase.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null)
  ]) : [{data:null},{data:null},{data:null},{count:0}]
  const next=program?.program_json?.workouts?.[0]
  const state={hasAssessment:!!assessment,hasProgram:!!program,hasCompletedWorkout:!!completed,hasReviewedProgress:!!completed}
  const steps=onboardingSteps(state), percent=onboardingPercent(state)
  return <main className="container"><AppNav/><div className="row"><div><div className="eyebrow">Home</div><h1>Your next session is ready.</h1></div><Link className="pill" href="/app/notifications">{unread ?? 0} unread</Link></div><div className="grid grid-2"><div className="card"><span className="pill">NEXT WORKOUT</span><h2>{next?.name ?? 'Create your programme'}</h2><p className="muted">{next ? `${next.exercises.length} exercises` : 'Complete the assessment to continue.'}</p><Link className="btn btn-primary button-link" href={next?'/app/workout':'/assessment'}>{next?'Start Workout':'Start Assessment'}</Link></div><div className="card"><div className="row"><div className="eyebrow">Getting started</div><strong>{percent}%</strong></div><div className="progress"><span style={{width:`${percent}%`}}/></div><div className="onboarding-list">{steps.map(step=><Link href={step.href} key={step.key} className={step.complete?'complete':''}><span>{step.complete?'✓':'○'}</span>{step.label}</Link>)}</div></div></div><div className="card lifecycle-card"><div><div className="eyebrow">Weekly reflection</div><h2>Turn training data into momentum.</h2><p className="muted">Generate an in-app summary of adherence, completed sets and progression wins.</p></div><form action="/api/lifecycle/weekly-summary" method="post"><button className="btn btn-secondary">Generate summary</button></form></div></main>
}
