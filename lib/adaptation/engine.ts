import { calculateNextTarget, type SetLog } from '@/lib/engine/progression'

export const ADAPTATION_ENGINE_VERSION = 'adaptation-v1.0.0'

export type AdaptationDecisionType = 'increase_load'|'build_reps'|'repeat'|'reduce_load'|'replace_exercise'|'regenerate_program'|'manual_review'
export type AdaptationProposal = {
  decisionType: AdaptationDecisionType
  reasonCode: string
  explanation: string
  confidence: number
  previousState: Record<string, unknown>
  nextState: Record<string, unknown>
  evidence: Record<string, unknown>
  status: 'proposed'|'review_required'
}

export function proposeExerciseAdaptation(input: {
  logs: SetLog[]
  minReps: number
  maxReps: number
  exerciseId: string
}): AdaptationProposal {
  const result = calculateNextTarget(input.logs, input.minReps, input.maxReps)
  const previousLoad = input.logs[0]?.load ?? 0
  const evidence = { logs: input.logs, minReps: input.minReps, maxReps: input.maxReps }

  if (result.state === 'Review') return {
    decisionType: 'manual_review', reasonCode: 'pain_reported',
    explanation: 'A pain report blocks automatic progression. Keep the current load and review or replace the exercise.',
    confidence: 1, previousState: { load: previousLoad }, nextState: { load: previousLoad }, evidence, status: 'review_required'
  }
  if (result.state === 'Increase') return {
    decisionType: 'increase_load', reasonCode: 'top_of_range_completed', explanation: result.target,
    confidence: 0.92, previousState: { load: previousLoad }, nextState: { load: result.nextLoad }, evidence, status: 'proposed'
  }
  if (result.state === 'Reduce') return {
    decisionType: 'reduce_load', reasonCode: 'minimum_reps_missed', explanation: result.target,
    confidence: 0.95, previousState: { load: previousLoad }, nextState: { load: result.nextLoad }, evidence, status: 'proposed'
  }
  if (result.state === 'Build Reps') return {
    decisionType: 'build_reps', reasonCode: 'within_rep_range', explanation: result.target,
    confidence: 0.88, previousState: { load: previousLoad }, nextState: { load: result.nextLoad, target: result.target }, evidence, status: 'proposed'
  }
  return {
    decisionType: 'repeat', reasonCode: 'high_difficulty_or_calibration', explanation: result.target,
    confidence: 0.86, previousState: { load: previousLoad }, nextState: { load: result.nextLoad, target: result.target }, evidence, status: 'proposed'
  }
}

export function shouldAutoApply(proposal: AdaptationProposal, minimumConfidence = 0.8) {
  if (proposal.status === 'review_required') return false
  if (proposal.decisionType === 'replace_exercise' || proposal.decisionType === 'regenerate_program') return false
  return proposal.confidence >= minimumConfidence
}

export function adaptationDedupeKey(sessionId: string, exerciseId: string, engineVersion = ADAPTATION_ENGINE_VERSION) {
  return `${sessionId}:${exerciseId}:${engineVersion}`
}
