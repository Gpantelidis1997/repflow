export type SetLog = { load:number; reps:number; difficulty:'Very Easy'|'Good'|'Very Hard'|'Pain' }
export type ProgressionDecision = { state:'Increase'|'Build Reps'|'Repeat'|'Reduce'|'Review'; nextLoad:number; target:string }

const roundToHalf = (value:number) => Math.round(value * 2) / 2

export function calculateNextTarget(logs:SetLog[], min:number, max:number):ProgressionDecision {
  if (!logs.length) return { state:'Repeat', nextLoad:0, target:'Complete calibration sets.' }
  const load = logs[0].load
  if (logs.some(x => x.difficulty === 'Pain')) return { state:'Review', nextLoad:load, target:'Do not increase. Review or replace the exercise.' }
  if (logs.some(x => x.reps < min)) return { state:'Reduce', nextLoad:roundToHalf(load * 0.9), target:`Reduce to ${roundToHalf(load * 0.9)} kg and rebuild reps.` }
  const allTop = logs.every(x => x.reps >= max)
  const allEasy = logs.every(x => x.difficulty === 'Very Easy')
  if (allTop || allEasy) {
    const increment = load < 30 ? 2 : 5
    return { state:'Increase', nextLoad:roundToHalf(load + increment), target:`Increase to ${roundToHalf(load + increment)} kg.` }
  }
  const total = logs.reduce((sum,x)=>sum+x.reps,0)
  if (logs.some(x => x.difficulty === 'Very Hard')) return { state:'Repeat', nextLoad:load, target:`Repeat ${load} kg and aim to improve execution.` }
  return { state:'Build Reps', nextLoad:load, target:`Keep ${load} kg and aim for ${total + 2} total reps.` }
}
