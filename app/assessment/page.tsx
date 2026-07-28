'use client'
import { useState } from 'react'
import { generateProgram } from '@/lib/engine/generator'
import type { AssessmentInput } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const steps = [
  ['goal','What is your main goal?',['Build Muscle','Strength and Muscle','General Fitness','Return to Training']],
  ['experience','What best describes your experience?',['Beginner','Early Intermediate','Intermediate']],
  ['days','How many days can you train?',[2,3,4,5]],
  ['duration','How much time do you have?',['30–40 minutes','45–60 minutes','60–75 minutes']],
  ['equipment','What equipment is available?',['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']],
  ['priority','Which area matters most?',['No Priority','Chest','Back','Shoulders','Legs','Glutes']]
] as const

export default function Assessment(){const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<Record<string,unknown>>({});const router=useRouter();const [key,q,options]=steps[index];const selected=answers[key];async function finish(){const assessment=answers as AssessmentInput;const program=generateProgram(assessment);const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user){localStorage.setItem('repflow-program',JSON.stringify(program));router.push('/app/program');return}const {data:assessmentRow,error:aError}=await supabase.from('assessments').insert({...assessment,user_id:user.id,status:'completed'}).select('id').single();if(aError)throw aError;const {error:pError}=await supabase.from('programs').insert({user_id:user.id,assessment_id:assessmentRow.id,status:'active',split:program.split,program_json:program});if(pError)throw pError;router.push('/app/program')}return <main className="container" style={{maxWidth:760}}><div className="eyebrow">Assessment</div><p className="muted">Step {index+1} of {steps.length}</p><div className="progress"><span style={{width:`${((index+1)/steps.length)*100}%`}}/></div><div className="card" style={{marginTop:20}}><h1>{q}</h1><div className="stack">{options.map(o=><button key={String(o)} className={`choice ${selected===o?'selected':''}`} onClick={()=>setAnswers({...answers,[key]:o})}>{String(o)}</button>)}</div><div className="row" style={{marginTop:20}}><button className="btn btn-secondary" onClick={()=>setIndex(Math.max(0,index-1))}>Back</button><button className="btn btn-primary" disabled={selected===undefined} onClick={()=>index===steps.length-1?finish():setIndex(index+1)}>{index===steps.length-1?'Build Program':'Continue'}</button></div></div></main>}
