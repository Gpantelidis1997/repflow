'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Flame, Timer, TrendingUp } from 'lucide-react'

type Goal = 'Build Muscle' | 'Strength' | 'General Fitness'
type Experience = 'Beginner' | 'Intermediate'
type DemoProfile = { name: string; goal: Goal; days: number; duration: number; experience: Experience }

const DEFAULT_PROFILE: DemoProfile = { name: 'Alex', goal: 'Build Muscle', days: 4, duration: 50, experience: 'Intermediate' }

export const DEMO_WORKOUT = [
  { id: 'bench', name: 'Barbell Bench Press', detail: '4 × 6–8', load: 70, rest: 120, pattern: 'Horizontal push' },
  { id: 'row', name: 'Chest-Supported Row', detail: '4 × 8–10', load: 55, rest: 90, pattern: 'Horizontal pull' },
  { id: 'press', name: 'Seated Dumbbell Press', detail: '3 × 8–10', load: 20, rest: 90, pattern: 'Vertical push' },
  { id: 'pulldown', name: 'Lat Pulldown', detail: '3 × 10–12', load: 50, rest: 75, pattern: 'Vertical pull' },
  { id: 'raise', name: 'Cable Lateral Raise', detail: '3 × 12–15', load: 7.5, rest: 60, pattern: 'Accessory' },
]

export function DemoProgram() {
  const [profile, setProfile] = useState<DemoProfile>(DEFAULT_PROFILE)
  const [editing, setEditing] = useState(false)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('repflow-demo-profile')
    const progress = Number(localStorage.getItem('repflow-demo-completed') || 0)
    if (saved) setProfile(JSON.parse(saved))
    setCompleted(progress)
  }, [])

  function saveProfile(next: DemoProfile) {
    setProfile(next)
    localStorage.setItem('repflow-demo-profile', JSON.stringify(next))
    setEditing(false)
  }

  const weekProgress = useMemo(() => Math.min(100, Math.round((completed / profile.days) * 100)), [completed, profile.days])

  if (editing) return <Onboarding initial={profile} onComplete={saveProfile} />

  return <main className="demo-shell">
    <header className="demo-topbar">
      <Link href="/" className="brand"><span className="brand-mark">R</span>RepFlow</Link>
      <div className="demo-badge">Interactive demo</div>
    </header>

    <section className="demo-welcome">
      <div>
        <p className="eyebrow">TODAY · UPPER A</p>
        <h1>Ready when you are, {profile.name}.</h1>
        <p className="muted">Your session is built for {profile.goal.toLowerCase()} and fits inside {profile.duration} minutes.</p>
      </div>
      <button className="text-button" onClick={() => setEditing(true)}>Edit assessment</button>
    </section>

    <section className="demo-grid-main">
      <article className="hero-workout-card">
        <div className="workout-card-head">
          <div><span className="pill pill-success">READY</span><h2>Upper Body · Performance</h2><p>{DEMO_WORKOUT.length} exercises · {profile.duration} min · Moderate fatigue</p></div>
          <div className="session-score"><strong>94</strong><span>quality score</span></div>
        </div>
        <div className="exercise-preview-list">
          {DEMO_WORKOUT.slice(0, 3).map((exercise, index) => <div className="exercise-preview" key={exercise.id}>
            <span className="exercise-number">{index + 1}</span>
            <div><strong>{exercise.name}</strong><small>{exercise.pattern}</small></div>
            <b>{exercise.detail}</b>
          </div>)}
        </div>
        <Link className="primary-cta" href="/demo/workout">Start workout <ArrowRight size={18}/></Link>
      </article>

      <aside className="demo-side-stack">
        <article className="stat-card"><div className="stat-icon"><Flame size={20}/></div><div><span>Current streak</span><strong>3 weeks</strong><small>Best: 5 weeks</small></div></article>
        <article className="stat-card"><div className="stat-icon"><TrendingUp size={20}/></div><div><span>Weekly progress</span><strong>{weekProgress}%</strong><small>{completed} of {profile.days} sessions</small></div></article>
        <article className="stat-card"><div className="stat-icon"><Timer size={20}/></div><div><span>Training time</span><strong>{completed * profile.duration} min</strong><small>This week</small></div></article>
      </aside>
    </section>

    <section className="demo-bottom-grid">
      <article className="demo-panel"><div className="panel-title"><div><p className="eyebrow">CURRENT BLOCK</p><h3>Foundation Hypertrophy</h3></div><span>Week 2 / 6</span></div><div className="week-track">{[1,2,3,4,5,6].map(week => <div key={week} className={week <= 2 ? 'active' : ''}><span>{week <= 1 ? <Check size={14}/> : week}</span><small>W{week}</small></div>)}</div></article>
      <article className="demo-panel"><div className="panel-title"><div><p className="eyebrow">NEXT SESSION</p><h3>Lower Body · Strength</h3></div><ChevronRight/></div><p className="muted">Tomorrow · 5 exercises · 52 minutes</p></article>
    </section>
  </main>
}

function Onboarding({ initial, onComplete }: { initial: DemoProfile; onComplete: (profile: DemoProfile) => void }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(initial)
  const questions = [
    { title: 'What should we call you?', content: <input autoFocus className="demo-input" value={profile.name} onChange={e => setProfile({...profile, name:e.target.value})} placeholder="Your first name"/> },
    { title: 'What is your main goal?', content: <Choice values={['Build Muscle','Strength','General Fitness']} selected={profile.goal} onChange={goal => setProfile({...profile, goal:goal as Goal})}/> },
    { title: 'How many days can you train?', content: <Choice values={[2,3,4,5]} selected={profile.days} onChange={days => setProfile({...profile, days:Number(days)})}/> },
    { title: 'How long is each session?', content: <Choice values={[35,45,50,60]} labels={['35 min','45 min','50 min','60 min']} selected={profile.duration} onChange={duration => setProfile({...profile, duration:Number(duration)})}/> },
    { title: 'What is your training experience?', content: <Choice values={['Beginner','Intermediate']} selected={profile.experience} onChange={experience => setProfile({...profile, experience:experience as Experience})}/> },
  ]
  return <main className="onboarding-shell"><Link href="/" className="brand"><span className="brand-mark">R</span>RepFlow</Link><div className="onboarding-card"><div className="onboarding-progress"><span style={{width:`${((step+1)/questions.length)*100}%`}}/></div><p className="eyebrow">STEP {step+1} OF {questions.length}</p><h1>{questions[step].title}</h1><div className="onboarding-content">{questions[step].content}</div><div className="onboarding-actions"><button className="secondary-cta" disabled={step===0} onClick={() => setStep(step-1)}>Back</button><button className="primary-cta" disabled={!profile.name.trim()} onClick={() => step===questions.length-1 ? onComplete(profile) : setStep(step+1)}>{step===questions.length-1 ? 'Generate my program' : 'Continue'} <ArrowRight size={18}/></button></div></div></main>
}

function Choice({ values, labels, selected, onChange }:{values:(string|number)[];labels?:string[];selected:string|number;onChange:(value:string|number)=>void}) {
  return <div className="demo-choice-grid">{values.map((value,index)=><button key={value} className={`demo-choice ${selected===value?'selected':''}`} onClick={()=>onChange(value)}>{labels?.[index] ?? value}</button>)}</div>
}
