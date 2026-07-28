import type { ExerciseCandidate, RankedExercise } from '@/lib/exercise-intelligence/types'

export type SessionGoal = 'hypertrophy' | 'strength' | 'general_fitness'
export type SessionFocus = 'upper' | 'lower' | 'full_body' | 'push' | 'pull'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type SessionConstraints = {
  focus: SessionFocus
  goal: SessionGoal
  durationMinutes: number
  equipment: string[]
  experience: ExperienceLevel
  contraindicationTags?: string[]
  preferredMuscles?: string[]
  maxFatigueCost?: number
}

export type SessionSlot = {
  key: string
  movementFamily: string
  role: 'primary' | 'secondary' | 'accessory' | 'core'
  sets: number
  repRange: [number, number]
  restSeconds: number
  required: boolean
}

export type BuiltSessionExercise = {
  slot: SessionSlot
  exercise: RankedExercise
  estimatedMinutes: number
}

export type SessionScore = {
  equipmentFit: number
  movementBalance: number
  timeFit: number
  fatigueFit: number
  duplicateControl: number
  overall: number
}

export type SessionValidationIssue = {
  code: string
  severity: 'warning' | 'error'
  message: string
}

export type BuiltSession = {
  name: string
  constraints: SessionConstraints
  exercises: BuiltSessionExercise[]
  estimatedMinutes: number
  totalSets: number
  score: SessionScore
  issues: SessionValidationIssue[]
  publishable: boolean
  engineVersion: string
}

export type SessionBuilderInput = {
  constraints: SessionConstraints
  candidates: ExerciseCandidate[]
}
