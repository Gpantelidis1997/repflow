'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppNav } from '@/components/AppNav'
import { calculateNextTarget, type SetLog } from '@/lib/engine/progression'
import { applyWorkoutMode, replacementCandidates } from '@/lib/engine/workout'
import { EXERCISES } from '@/lib/engine/exercises'
import { replaceExerciseInProgram } from '@/lib/engine/program'
import { createClient } from '@/lib/supabase/client'
import type { GeneratedProgram, ProgramWorkout, SessionExercise, WorkoutMode } from '@/lib/types'

const LOCAL_KEY = 'repflow-active-workout-v2'

type ActiveState = {
  sessionId?: string
  programId: string
  workout: ProgramWorkout
  mode: WorkoutMode
  exerciseIndex: number
  logs: Record<string, SetLog[]>
  startedAt: string
}

export default function WorkoutPage() {
  const [state, setState] = useState<ActiveState | null>(null)
  const [program, setProgram] = useState<GeneratedProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [sync, setSync] = useState<'saved'|'saving'|'offline'>('saved')
  const [showReplacements, setShowReplacements] = useState(false)
  const [summary, setSummary] = useState<Array<{name:string; state:string; target:string}> | null>(null)
  const [pendingPermanent, setPendingPermanent] = useState<SessionExercise | null>(null)

  useEffect(() => { void initialise() }, [])
  useEffect(() => {
    if (state) localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  }, [state])

  async function initialise() {
    const cached = localStorage.getItem(LOCAL_KEY)
    if (cached) {
      setState(JSON.parse(cached))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('programs').select('id,program_json').eq('user_id', user.id).eq('status','active').maybeSingle()
    if (data?.program_json) {
      setProgram(data.program_json as GeneratedProgram)
    }
    setLoading(false)
  }

  async function startWorkout(mode: WorkoutMode) {
    if (!program) return
    const base = program.workouts[0]
    const workout = applyWorkoutMode(base, mode)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const startedAt = new Date().toISOString()
    const { data } = await supabase.from('workout_sessions').insert({
      user_id:user.id, workout_name:workout.name, status:'in_progress', workout_mode:mode,
      current_exercise_index:0, started_at:startedAt, session_json:{workout}
    }).select('id').single()
    setState({ sessionId:data?.id, programId:(await supabase.from('programs').select('id').eq('user_id',user.id).eq('status','active').maybeSingle()).data?.id ?? '', workout, mode, exerciseIndex:0, logs:{}, startedAt })
  }

  const exercise = state?.workout.exercises[state.exerciseIndex] as SessionExercise | undefined
  const exerciseLogs = exercise && state ? (state.logs[exercise.id] ?? []) : []
  const candidates = useMemo(() => exercise ? replacementCandidates(exercise, EXERCISES) : [], [exercise])

  async function addSet(formData: FormData) {
    if (!state || !exercise) return
    const nextLog:SetLog = {
      load:Number(formData.get('load')),
      reps:Number(formData.get('reps')),
      difficulty:String(formData.get('difficulty')) as SetLog['difficulty']
    }
    const nextLogs = [...exerciseLogs, nextLog]
    const nextState = {...state, logs:{...state.logs,[exercise.id]:nextLogs}}
    setState(nextState)
    setSync('saving')
    try {
      const supabase = createClient()
      const { data:{user} } = await supabase.auth.getUser()
      if (!user || !state.sessionId) throw new Error('No active session')
      const { error } = await supabase.from('set_logs').upsert({
        user_id:user.id, workout_session_id:state.sessionId, exercise_id:exercise.id,
        set_number:nextLogs.length, load:nextLog.load, reps:nextLog.reps, difficulty:nextLog.difficulty,
        updated_at:new Date().toISOString()
      }, { onConflict:'workout_session_id,exercise_id,set_number' })
      if (error) throw error
      await supabase.from('workout_sessions').update({last_synced_at:new Date().toISOString()}).eq('id',state.sessionId)
      setSync('saved')
    } catch { setSync('offline') }
  }

  function nextExercise() {
    if (!state) return
    setShowReplacements(false)
    setState({...state,exerciseIndex:Math.min(state.exerciseIndex+1,state.workout.exercises.length-1)})
  }

  async function replaceExercise(replacement: SessionExercise, scope:'session'|'program') {
    if (!state || !exercise) return
    if (scope === 'program') { setPendingPermanent(replacement); return }
    const exercises = [...state.workout.exercises] as SessionExercise[]
    exercises[state.exerciseIndex] = {...replacement, originalExerciseId:exercise.id, replacementScope:scope}
    setState({...state,workout:{...state.workout,exercises}})
    setShowReplacements(false)
    if (state.sessionId) {
      const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser()
      if(user) await supabase.from('exercise_replacements').insert({user_id:user.id,workout_session_id:state.sessionId,original_exercise_id:exercise.id,replacement_exercise_id:replacement.id,reason:'Busy Equipment',scope})
    }
  }

  async function confirmPermanentReplacement(){
    if(!state || !exercise || !pendingPermanent || !program || !state.programId) return
    const versioned=replaceExerciseInProgram(program,exercise.id,pendingPermanent)
    if(!versioned.changed){setPendingPermanent(null);return}
    const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return
    const {error}=await supabase.rpc('create_program_version',{target_program_id:state.programId,next_program_json:versioned.program,version_reason:'Permanent Exercise Replacement'})
    if(error){alert(error.message);return}
    const exercises=[...state.workout.exercises] as SessionExercise[]
    exercises[state.exerciseIndex]={...pendingPermanent,originalExerciseId:exercise.id,replacementScope:'program'}
    if(state.sessionId) await supabase.from('exercise_replacements').insert({user_id:user.id,workout_session_id:state.sessionId,original_exercise_id:exercise.id,replacement_exercise_id:pendingPermanent.id,reason:'Permanent replacement confirmed',scope:'program'})
    setProgram(versioned.program);setState({...state,workout:{...state.workout,exercises}});setPendingPermanent(null);setShowReplacements(false)
  }

  async function finishWorkout() {
    if (!state) return
    const decisions = state.workout.exercises.map(ex => {
      const logs = state.logs[ex.id] ?? []
      const result = calculateNextTarget(logs, ex.min, ex.max)
      return {name:ex.name,state:result.state,target:result.target,exerciseId:ex.id,nextLoad:result.nextLoad,previousLoad:logs[0]?.load ?? ex.load}
    })
    if (state.sessionId) {
      const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser()
      if(user){
        const completedExercises = state.workout.exercises.filter(ex => (state.logs[ex.id]?.length ?? 0) > 0).length
        const status = completedExercises === state.workout.exercises.length ? 'completed' : 'partial'
        await supabase.from('workout_sessions').update({status,completed_at:new Date().toISOString(),current_exercise_index:state.exerciseIndex,session_json:{workout:state.workout,logs:state.logs}}).eq('id',state.sessionId)
        await supabase.from('progression_records').insert(decisions.map(d=>({user_id:user.id,workout_session_id:state.sessionId,exercise_id:d.exerciseId,state:d.state,previous_load:d.previousLoad,next_load:d.nextLoad,target_text:d.target})))
      }
    }
    setSummary(decisions)
    localStorage.removeItem(LOCAL_KEY)
    setState(null)
  }

  if (loading) return <main className="container"><AppNav/><div className="card">Loading workout…</div></main>
  if (summary) return <main className="container"><AppNav/><div className="eyebrow">Workout complete</div><h1>Your next targets</h1><div className="stack">{summary.map(item=><div className="card" key={item.name}><div className="row"><strong>{item.name}</strong><span className="pill">{item.state}</span></div><p className="muted">{item.target}</p></div>)}</div><button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setSummary(null)}>Done</button></main>
  if (!state) return <main className="container"><AppNav/><div className="eyebrow">Workout</div><h1>Choose today’s session</h1>{!program?<div className="card">No active program found.</div>:<div className="grid grid-2"><button className="choice" onClick={()=>startWorkout('full')}><strong>{program.workouts[0].name}</strong><p className="muted">Full workout • {program.workouts[0].exercises.length} exercises</p></button><button className="choice" onClick={()=>startWorkout('short')}><strong>30-minute version</strong><p className="muted">Compounds and priority work only</p></button></div>}</main>
  if (!exercise) return null

  const complete = exerciseLogs.length >= exercise.sets
  return <main className="container"><AppNav/><div className="row"><div><div className="eyebrow">{state.mode} workout</div><h1>{exercise.name}</h1></div><span className="pill">{state.exerciseIndex+1} / {state.workout.exercises.length}</span></div><div className="progress"><span style={{width:`${((state.exerciseIndex+1)/state.workout.exercises.length)*100}%`}}/></div><p className="muted">{exercise.sets} sets • {exercise.min}–{exercise.max} reps • {exercise.rest} sec rest • {sync}</p><div className="grid grid-2"><div className="card"><div className="eyebrow">Today’s load</div><div className="metric">{exercise.load} kg</div></div><div className="card"><div className="eyebrow">Saved sets</div><div className="metric">{exerciseLogs.length} / {exercise.sets}</div></div></div>{exerciseLogs.map((log,index)=><div className="card row" style={{marginTop:12}} key={index}><strong>Set {index+1}</strong><span>{log.load} kg × {log.reps}</span><span className="muted">{log.difficulty}</span></div>)}{!complete&&<form className="card stack" style={{marginTop:16}} action={addSet}><label>Weight<input className="input" name="load" type="number" step="0.5" defaultValue={exerciseLogs.at(-1)?.load ?? exercise.load}/></label><label>Reps<input className="input" name="reps" type="number" min="0" defaultValue={exercise.min}/></label><label>Difficulty<select className="input" name="difficulty" defaultValue="Good"><option>Very Easy</option><option>Good</option><option>Very Hard</option><option>Pain</option></select></label><button className="btn btn-primary">Save Set {exerciseLogs.length+1}</button></form>}<div className="row" style={{marginTop:16}}><button className="btn btn-secondary" onClick={()=>setShowReplacements(!showReplacements)}>Replace</button>{complete && state.exerciseIndex < state.workout.exercises.length-1 && <button className="btn btn-primary" onClick={nextExercise}>Next Exercise</button>}{(complete || state.exerciseIndex===state.workout.exercises.length-1) && <button className="btn btn-primary" onClick={finishWorkout}>Finish Workout</button>}</div>{showReplacements&&<div className="stack" style={{marginTop:16}}><div className="eyebrow">Replacement options</div>{candidates.map(candidate=><div className="card" key={candidate.id}><strong>{candidate.name}</strong><p className="muted">{candidate.pattern} • {candidate.role}</p><div className="row"><button className="btn btn-secondary" onClick={()=>replaceExercise(candidate,'session')}>Today Only</button><button className="btn btn-primary" onClick={()=>replaceExercise(candidate,'program')}>Permanent</button></div></div>)}</div>}{pendingPermanent&&<div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal-card"><div className="eyebrow">Permanent replacement</div><h2>Update the active programme?</h2><p className="muted"><strong>{exercise.name}</strong> will be replaced by <strong>{pendingPermanent.name}</strong> anywhere it appears. A new programme version will be created and previous history will remain unchanged.</p><div className="action-row"><button className="btn btn-secondary" onClick={()=>setPendingPermanent(null)}>Cancel</button><button className="btn btn-primary" onClick={confirmPermanentReplacement}>Create New Version</button></div></div></div>}</main>
}
