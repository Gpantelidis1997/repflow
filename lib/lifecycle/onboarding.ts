export type OnboardingState = {
  hasAssessment: boolean
  hasProgram: boolean
  hasCompletedWorkout: boolean
  hasReviewedProgress: boolean
}

export function onboardingSteps(state: OnboardingState) {
  return [
    { key: 'assessment', label: 'Complete assessment', href: '/assessment', complete: state.hasAssessment },
    { key: 'program', label: 'Generate your programme', href: '/app/program', complete: state.hasProgram },
    { key: 'workout', label: 'Complete your first workout', href: '/app/workout', complete: state.hasCompletedWorkout },
    { key: 'progress', label: 'Review your progress', href: '/app/progress', complete: state.hasReviewedProgress }
  ]
}

export function onboardingPercent(state: OnboardingState) {
  const steps = onboardingSteps(state)
  return Math.round((steps.filter(step => step.complete).length / steps.length) * 100)
}
