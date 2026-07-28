'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Clock3, Minus, Plus, RotateCcw } from 'lucide-react'
import { DEMO_WORKOUT } from './DemoProgram'

type SetLog={weight:number;reps:number;done:boolean}

export function DemoWorkout(){
 const [exerciseIndex,setExerciseIndex]=useState(0)
 const [logs,setLogs]=useState<Record<string,SetLog[]>>({})
 const [finished,setFinished]=useState(false)
 const exercise=DEMO_WORKOUT[exerciseIndex]
 const targetSets=Number(exercise.detail.split(' ')[0])
 const exerciseLogs=logs[exercise.id] ?? []
 const progress=Math.round(((exerciseIndex + Math.min(1,exerciseLogs.length/targetSets))/DEMO_WORKOUT.length)*100)
 useEffect(()=>{const saved=localStorage.getItem('repflow-demo-logs');if(saved)setLogs(JSON.parse(saved))},[])
 function update(next:Record<string,SetLog[]>){setLogs(next);localStorage.setItem('repflow-demo-logs',JSON.stringify(next))}
 function addSet(){const previous=exerciseLogs.at(-1);update({...logs,[exercise.id]:[...exerciseLogs,{weight:previous?.weight??exercise.load,reps:previous?.reps??Number(exercise.detail.match(/× (\d+)/)?.[1]??8),done:false}]})}
 function adjust(index:number,key:'weight'|'reps',delta:number){const next=exerciseLogs.map((log,i)=>i===index?{...log,[key]:Math.max(0,log[key]+delta)}:log);update({...logs,[exercise.id]:next})}
 function toggle(index:number){const next=exerciseLogs.map((log,i)=>i===index?{...log,done:!log.done}:log);update({...logs,[exercise.id]:next})}
 const allDone=exerciseLogs.length>=targetSets&&exerciseLogs.slice(0,targetSets).every(log=>log.done)
 function next(){if(exerciseIndex===DEMO_WORKOUT.length-1){setFinished(true);localStorage.setItem('repflow-demo-completed','1')}else setExerciseIndex(exerciseIndex+1)}
 const totalSets=useMemo(()=>Object.values(logs).flat().filter(x=>x.done).length,[logs])
 if(finished)return <main className="finish-shell"><div className="finish-check"><Check size={34}/></div><p className="eyebrow">WORKOUT COMPLETE</p><h1>Strong work.</h1><p className="muted">You completed {totalSets} sets. RepFlow will use today’s performance to prepare your next targets.</p><div className="result-card"><span>Bench Press next target</span><strong>72.5 kg × 6–8</strong><small>Suggested increase: +2.5 kg</small></div><Link className="primary-cta" href="/demo">Back to dashboard</Link><button className="text-button" onClick={()=>{localStorage.removeItem('repflow-demo-logs');setLogs({});setExerciseIndex(0);setFinished(false)}}><RotateCcw size={16}/> Reset demo</button></main>
 return <main className="workout-shell"><header className="workout-topbar"><Link href="/demo" aria-label="Back"><ArrowLeft/></Link><div><span>Upper Body · Performance</span><strong>{progress}% complete</strong></div><div className="mini-progress"><span style={{width:`${progress}%`}}/></div></header><section className="workout-content"><div className="workout-title-row"><div><p className="eyebrow">EXERCISE {exerciseIndex+1} OF {DEMO_WORKOUT.length}</p><h1>{exercise.name}</h1><p className="muted">{exercise.pattern} · {exercise.detail} · {exercise.rest}s rest</p></div><div className="exercise-visual"><span>{exercise.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span></div></div><div className="set-table-head"><span>Set</span><span>Weight</span><span>Reps</span><span>Done</span></div><div className="set-list">{Array.from({length:targetSets}).map((_,index)=>{const log=exerciseLogs[index];return <div className={`set-row ${log?.done?'complete':''}`} key={index}><strong>{index+1}</strong><div className="stepper"><button onClick={()=>log&&adjust(index,'weight',-2.5)}><Minus size={15}/></button><span>{log?.weight??exercise.load}<small>kg</small></span><button onClick={()=>log&&adjust(index,'weight',2.5)}><Plus size={15}/></button></div><div className="stepper"><button onClick={()=>log&&adjust(index,'reps',-1)}><Minus size={15}/></button><span>{log?.reps??'–'}</span><button onClick={()=>log&&adjust(index,'reps',1)}><Plus size={15}/></button></div>{!log?<button className="add-set-button" onClick={addSet}>Log</button>:<button className="done-button" onClick={()=>toggle(index)}>{log.done?<Check size={18}/>:index+1}</button>}</div>})}</div><div className="rest-card"><Clock3 size={18}/><div><strong>Rest recommendation</strong><span>{exercise.rest} seconds between working sets</span></div></div><button className="primary-cta full-width" disabled={!allDone} onClick={next}>{exerciseIndex===DEMO_WORKOUT.length-1?'Finish workout':'Next exercise'} <ChevronRight size={18}/></button><button className="text-button centered" onClick={next}>Skip exercise</button></section></main>
}
