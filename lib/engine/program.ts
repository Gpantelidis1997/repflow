import type { GeneratedProgram, ProgramWorkout, SessionExercise } from '@/lib/types'

export type ProgramChangeReason =
  | 'Permanent Exercise Replacement'
  | 'Goal Change'
  | 'Training Days Change'
  | 'Equipment Change'
  | 'Duration Change'
  | 'Manual Regeneration'

export type ProgramVersionResult = {
  program: GeneratedProgram
  changed: boolean
  affectedWorkouts: string[]
}

export function replaceExerciseInProgram(
  source: GeneratedProgram,
  originalExerciseId: string,
  replacement: SessionExercise,
): ProgramVersionResult {
  const affectedWorkouts: string[] = []
  const workouts: ProgramWorkout[] = source.workouts.map(workout => {
    let changed = false
    const exercises = workout.exercises.map(exercise => {
      if (exercise.id !== originalExerciseId) return exercise
      changed = true
      return {
        ...replacement,
        originalExerciseId,
        replacementScope: 'program' as const,
      }
    })
    if (changed) affectedWorkouts.push(workout.name)
    return { ...workout, exercises }
  })

  return {
    program: { ...source, workouts },
    changed: affectedWorkouts.length > 0,
    affectedWorkouts,
  }
}

export function shouldRegenerateProgram(input: {
  goalChanged?: boolean
  daysChanged?: boolean
  equipmentChanged?: boolean
  durationChanged?: boolean
  replacementCount?: number
  longBreakDays?: number
}) {
  if (input.goalChanged || input.daysChanged || input.equipmentChanged || input.durationChanged) return true
  if ((input.replacementCount ?? 0) >= 4) return true
  if ((input.longBreakDays ?? 0) >= 42) return true
  return false
}
