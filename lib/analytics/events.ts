export type AnalyticsEvent =
  | 'account_created' | 'assessment_completed' | 'program_generated'
  | 'workout_started' | 'set_logged' | 'exercise_replaced'
  | 'workout_completed' | 'review_completed'

export async function trackEvent(name: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/analytics', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,properties})})
  } catch { /* analytics must never block training */ }
}
