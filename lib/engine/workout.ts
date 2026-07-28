import type { ExerciseSeed, ProgramWorkout, WorkoutMode } from '@/lib/types'

export function createWorkoutSequence(workouts: ProgramWorkout[], lastWorkoutName?: string | null) {
  if (!workouts.length) return null
  if (!lastWorkoutName) return workouts[0]
  const index = workouts.findIndex(workout => workout.name === lastWorkoutName)
  return workouts[(index + 1 + workouts.length) % workouts.length]
}

export function createShortWorkout(workout: ProgramWorkout): ProgramWorkout {
  const essential = workout.exercises.filter(exercise =>
    exercise.role === 'Primary Compound' || exercise.role === 'Secondary Compound'
  )
  const support = workout.exercises.filter(exercise =>
    exercise.role !== 'Primary Compound' && exercise.role !== 'Secondary Compound'
  )
  const selected: ExerciseSeed[] = [...essential.slice(0, 3), ...support.slice(0, 2)]
  return { ...workout, name: `${workout.name} — Short`, exercises: selected }
}

export function applyWorkoutMode(workout: ProgramWorkout, mode: WorkoutMode) {
  return mode === 'short' ? createShortWorkout(workout) : workout
}

export function replacementCandidates(current: ExerciseSeed, all: ExerciseSeed[]) {
  return all
    .filter(candidate => candidate.id !== current.id)
    .filter(candidate => candidate.pattern === current.pattern)
    .sort((a, b) => {
      const roleA = a.role === current.role ? 1 : 0
      const roleB = b.role === current.role ? 1 : 0
      return roleB - roleA
    })
    .slice(0, 3)
}
