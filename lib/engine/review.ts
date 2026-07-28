export type ReviewRecommendation =
  | 'Continue'
  | 'Minor Adjustment'
  | 'Volume Reduction'
  | 'Exercise Replacement'
  | 'Frequency Change'
  | 'New Program'

export type ReviewInput = {
  adherencePercent: number
  painEvents: number
  progressingExercisePercent: number
  replacementCount: number
  averageDurationVarianceMinutes: number
  requestedFrequencyChange?: boolean
  majorProfileChange?: boolean
}

export type ReviewResult = {
  recommendation: ReviewRecommendation
  reasons: string[]
}

export function generateMonthlyReview(input: ReviewInput): ReviewResult {
  const reasons: string[] = []

  if (input.majorProfileChange) {
    return { recommendation: 'New Program', reasons: ['Your main training profile has changed.'] }
  }
  if (input.requestedFrequencyChange) {
    return { recommendation: 'Frequency Change', reasons: ['Your available training frequency has changed.'] }
  }
  if (input.painEvents >= 3 || input.replacementCount >= 4) {
    reasons.push(input.painEvents >= 3 ? 'Repeated discomfort was reported.' : 'Several exercises required replacement.')
    return { recommendation: 'Exercise Replacement', reasons }
  }
  if (input.adherencePercent < 60) {
    return {
      recommendation: 'Volume Reduction',
      reasons: ['The current weekly workload is difficult to complete consistently.'],
    }
  }
  if (input.averageDurationVarianceMinutes > 15) {
    return {
      recommendation: 'Minor Adjustment',
      reasons: ['Workouts regularly exceed the selected session duration.'],
    }
  }
  if (input.progressingExercisePercent < 30) {
    return {
      recommendation: 'Minor Adjustment',
      reasons: ['Progress has slowed across most tracked exercises.'],
    }
  }
  return {
    recommendation: 'Continue',
    reasons: ['Adherence and exercise progression support keeping the current programme.'],
  }
}
