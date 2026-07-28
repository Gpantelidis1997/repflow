import { describe, expect, it } from 'vitest'
import { adaptationDedupeKey, proposeExerciseAdaptation, shouldAutoApply } from '@/lib/adaptation/engine'

describe('adaptation engine', () => {
  it('increases load after all sets reach the top of the range', () => {
    const proposal = proposeExerciseAdaptation({ exerciseId:'squat', minReps:8, maxReps:12, logs:[
      {load:40,reps:12,difficulty:'Good'}, {load:40,reps:12,difficulty:'Good'}, {load:40,reps:12,difficulty:'Good'}
    ] })
    expect(proposal.decisionType).toBe('increase_load')
    expect(shouldAutoApply(proposal)).toBe(true)
  })
  it('blocks automatic progression after pain', () => {
    const proposal = proposeExerciseAdaptation({ exerciseId:'squat', minReps:8, maxReps:12, logs:[{load:40,reps:10,difficulty:'Pain'}] })
    expect(proposal.status).toBe('review_required')
    expect(shouldAutoApply(proposal)).toBe(false)
  })
  it('creates stable dedupe keys', () => expect(adaptationDedupeKey('session','exercise')).toContain('session:exercise:'))
})
