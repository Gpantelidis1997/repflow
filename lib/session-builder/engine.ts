import { rankExercises } from '@/lib/exercise-intelligence/rank'
import type { ExerciseCandidate } from '@/lib/exercise-intelligence/types'
import { createSessionSlots } from './blueprints'
import type { BuiltSession, BuiltSessionExercise, SessionBuilderInput, SessionConstraints, SessionScore, SessionValidationIssue } from './types'

export const SESSION_BUILDER_VERSION = 'session-builder-v1.0.0'

const difficultyFor = (experience: SessionConstraints['experience']) => experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4

function estimateExerciseMinutes(exercise: ExerciseCandidate, sets: number, restSeconds: number): number {
  const setSeconds = Number((exercise as ExerciseCandidate & { estimated_set_seconds?: number }).estimated_set_seconds ?? 45)
  const setupSeconds = Number((exercise as ExerciseCandidate & { setup_time_seconds?: number }).setup_time_seconds ?? 60)
  return Math.ceil((setupSeconds + sets * setSeconds + Math.max(0, sets - 1) * restSeconds) / 60)
}

function scoreSession(exercises: BuiltSessionExercise[], durationMinutes: number, estimatedMinutes: number): SessionScore {
  const clusters = exercises.map(item => item.exercise.duplicate_cluster).filter(Boolean)
  const uniqueClusters = new Set(clusters)
  const averageRank = exercises.length ? exercises.reduce((sum, item) => sum + item.exercise.score, 0) / exercises.length : 0
  const fatigueAverage = exercises.length ? exercises.reduce((sum, item) => sum + (item.exercise.fatigue_cost ?? 2), 0) / exercises.length : 5
  const timeDelta = Math.abs(durationMinutes - estimatedMinutes)
  const timeFit = Math.max(0, 100 - timeDelta * 5 - (estimatedMinutes > durationMinutes ? 20 : 0))
  const duplicateControl = clusters.length === uniqueClusters.size ? 100 : 55
  const movementBalance = exercises.length >= 4 ? 100 : exercises.length * 20
  const fatigueFit = Math.max(0, 110 - fatigueAverage * 15)
  const equipmentFit = Math.round(averageRank)
  const overall = Math.round(equipmentFit * .25 + movementBalance * .25 + timeFit * .2 + fatigueFit * .15 + duplicateControl * .15)
  return { equipmentFit, movementBalance, timeFit, fatigueFit, duplicateControl, overall }
}

export function buildSession({ constraints, candidates }: SessionBuilderInput): BuiltSession {
  const slots = createSessionSlots(constraints)
  const selected: BuiltSessionExercise[] = []
  const excludedClusters: string[] = []
  const excludedExerciseIds: string[] = []
  const issues: SessionValidationIssue[] = []

  for (const sessionSlot of slots) {
    const ranked = rankExercises(candidates, {
      movementFamily: sessionSlot.movementFamily,
      role: sessionSlot.role,
      equipment: constraints.equipment,
      maxDifficulty: difficultyFor(constraints.experience),
      excludedClusters,
      excludedExerciseIds,
      contraindicationTags: constraints.contraindicationTags ?? [],
      preferredMuscles: constraints.preferredMuscles ?? [],
      maxFatigueCost: constraints.maxFatigueCost,
    })
    const exercise = ranked[0]
    if (!exercise) {
      issues.push({ code: 'missing_slot_candidate', severity: sessionSlot.required ? 'error' : 'warning', message: `No compatible exercise found for ${sessionSlot.movementFamily}.` })
      continue
    }
    selected.push({ slot: sessionSlot, exercise, estimatedMinutes: estimateExerciseMinutes(exercise, sessionSlot.sets, sessionSlot.restSeconds) })
    excludedExerciseIds.push(exercise.exercise_id)
    if (exercise.duplicate_cluster) excludedClusters.push(exercise.duplicate_cluster)
  }

  let estimatedMinutes = 6 + selected.reduce((sum, item) => sum + item.estimatedMinutes, 0)
  while (estimatedMinutes > constraints.durationMinutes && selected.some(item => !item.slot.required)) {
    const removable = [...selected].reverse().find(item => !item.slot.required)
    if (!removable) break
    selected.splice(selected.indexOf(removable), 1)
    issues.push({ code: 'optional_slot_trimmed', severity: 'warning', message: `${removable.slot.movementFamily} was removed to respect the time limit.` })
    estimatedMinutes = 6 + selected.reduce((sum, item) => sum + item.estimatedMinutes, 0)
  }

  if (estimatedMinutes > constraints.durationMinutes) issues.push({ code: 'duration_exceeded', severity: 'error', message: `Estimated duration is ${estimatedMinutes} minutes, above the ${constraints.durationMinutes}-minute limit.` })
  if (selected.length < 3) issues.push({ code: 'insufficient_session_depth', severity: 'error', message: 'The exercise catalogue cannot produce a sufficiently complete session for these constraints.' })

  const score = scoreSession(selected, constraints.durationMinutes, estimatedMinutes)
  if (score.overall < 85) issues.push({ code: 'quality_threshold', severity: 'error', message: `Session quality score ${score.overall} is below the publishing threshold of 85.` })

  return {
    name: `${constraints.focus.replace('_', ' ')} · ${constraints.goal}`,
    constraints,
    exercises: selected,
    estimatedMinutes,
    totalSets: selected.reduce((sum, item) => sum + item.slot.sets, 0),
    score,
    issues,
    publishable: !issues.some(issue => issue.severity === 'error'),
    engineVersion: SESSION_BUILDER_VERSION,
  }
}
