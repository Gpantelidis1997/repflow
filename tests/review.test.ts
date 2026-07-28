import { describe, expect, it } from 'vitest'
import { generateMonthlyReview } from '@/lib/engine/review'

describe('monthly review engine', () => {
  it('continues a programme that is working', () => {
    expect(generateMonthlyReview({
      adherencePercent: 88, painEvents: 0, progressingExercisePercent: 70,
      replacementCount: 0, averageDurationVarianceMinutes: 4,
    }).recommendation).toBe('Continue')
  })

  it('reduces volume when adherence is low', () => {
    expect(generateMonthlyReview({
      adherencePercent: 48, painEvents: 0, progressingExercisePercent: 50,
      replacementCount: 0, averageDurationVarianceMinutes: 5,
    }).recommendation).toBe('Volume Reduction')
  })
})
