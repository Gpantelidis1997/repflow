import type { ExerciseCandidate, ExerciseRequest, RankedExercise } from './types'
const normalise = (value: string) => value.trim().toLowerCase()
const overlap = (a: string[] = [], b: string[] = []) => {
  const wanted = new Set(b.map(normalise))
  return a.filter(item => wanted.has(normalise(item))).length
}
export function rankExercise(candidate: ExerciseCandidate, request: ExerciseRequest): RankedExercise | null {
  if (candidate.active === false || candidate.generator_enabled === false) return null
  if (request.excludedExerciseIds?.includes(candidate.exercise_id)) return null
  if (candidate.duplicate_cluster && request.excludedClusters?.includes(candidate.duplicate_cluster)) return null
  if (request.maxDifficulty && candidate.difficulty_level > request.maxDifficulty) return null
  if (request.maxFatigueCost && (candidate.fatigue_cost ?? 2) > request.maxFatigueCost) return null
  if (overlap(candidate.contraindication_tags, request.contraindicationTags) > 0) return null
  const available = request.equipment.map(normalise)
  const required = (candidate.equipment ?? []).map(normalise).filter(x => x !== 'bodyweight')
  if (required.some(item => !available.includes(item))) return null

  let score = 0
  const reasons: string[] = []
  if (candidate.movement_family === request.movementFamily) { score += 45; reasons.push('exact movement family') }
  else return null
  if (!request.role || normalise(candidate.exercise_role).includes(normalise(request.role))) { score += 12; reasons.push('session role match') }
  score += Math.max(0, 12 - (candidate.difficulty_level - 1) * 3)
  score += Math.max(0, 10 - ((candidate.fatigue_cost ?? 2) - 1) * 2)
  score += Math.max(0, 8 - ((candidate.skill_demand ?? 2) - 1) * 2)
  const muscleHits = overlap([candidate.primary_muscle, ...(candidate.secondary_muscles ?? [])], request.preferredMuscles)
  if (muscleHits) { score += Math.min(10, muscleHits * 5); reasons.push('preferred muscle match') }
  if ((candidate.smart_tags ?? []).includes('beginner_friendly')) { score += 3; reasons.push('beginner friendly') }
  return { ...candidate, score: Math.min(100, score), reasons }
}
export function rankExercises(candidates: ExerciseCandidate[], request: ExerciseRequest): RankedExercise[] {
  return candidates.map(c => rankExercise(c, request)).filter((x): x is RankedExercise => Boolean(x)).sort((a,b) => b.score-a.score || a.exercise_name.localeCompare(b.exercise_name))
}
export function compatibilityScore(source: ExerciseCandidate, alternative: ExerciseCandidate): number {
  if (source.exercise_id === alternative.exercise_id) return 0
  let score = 0
  if (source.movement_family === alternative.movement_family) score += 45
  if (normalise(source.primary_muscle) === normalise(alternative.primary_muscle)) score += 20
  score += Math.min(10, overlap(source.secondary_muscles, alternative.secondary_muscles) * 5)
  if (source.exercise_role === alternative.exercise_role) score += 10
  score += Math.max(0, 10 - Math.abs(source.difficulty_level - alternative.difficulty_level) * 5)
  if (source.duplicate_cluster === alternative.duplicate_cluster) score += 5
  return Math.min(100, score)
}
