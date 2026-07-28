export type ExerciseCandidate = {
  exercise_id: string
  exercise_name: string
  movement_family?: string | null
  primary_muscle: string
  secondary_muscles?: string[]
  equipment?: string[]
  difficulty_level: number
  exercise_role: string
  fatigue_cost?: number
  skill_demand?: number
  duplicate_cluster?: string | null
  smart_tags?: string[]
  contraindication_tags?: string[]
  generator_enabled?: boolean
  active?: boolean
}

export type ExerciseRequest = {
  movementFamily: string
  role?: string
  equipment: string[]
  maxDifficulty?: number
  excludedClusters?: string[]
  excludedExerciseIds?: string[]
  contraindicationTags?: string[]
  preferredMuscles?: string[]
  maxFatigueCost?: number
}

export type RankedExercise = ExerciseCandidate & { score: number; reasons: string[] }
