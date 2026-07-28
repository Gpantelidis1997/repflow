export type WeeklyLifecycleInput = {
  scheduled: number
  completed: number
  partial: number
  totalSets: number
  personalBests: number
}

export function buildWeeklySummary(input: WeeklyLifecycleInput) {
  const weighted = input.completed + input.partial * 0.5
  const adherence = input.scheduled > 0 ? Math.round((weighted / input.scheduled) * 100) : 0
  const headline = adherence >= 85 ? 'Excellent consistency this week.' : adherence >= 60 ? 'Solid week. Keep the rhythm.' : 'A lighter week — restart with the next session.'
  return {
    adherence,
    headline,
    body: `${input.completed} completed workout${input.completed === 1 ? '' : 's'}, ${input.totalSets} working sets and ${input.personalBests} progression win${input.personalBests === 1 ? '' : 's'}.`
  }
}
