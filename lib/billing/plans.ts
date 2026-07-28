export type PlanKey = 'free' | 'pro' | 'founder' | 'beta'

export const plans = {
  free: {
    key: 'free', name: 'Free', price: '€0', cadence: 'forever',
    features: ['One active program', 'Workout logging', 'Basic progress history'],
  },
  pro: {
    key: 'pro', name: 'Pro', price: '€9.99', cadence: 'per month',
    features: ['Unlimited program versions', 'Monthly reviews', 'Exercise replacements', 'Advanced progression history'],
  },
  founder: {
    key: 'founder', name: 'Founder', price: '€79', cadence: 'one-time beta offer',
    features: ['Lifetime Pro access', 'Founder badge', 'Priority beta feedback channel'],
  },
  beta: {
    key: 'beta', name: 'Beta', price: '€0', cadence: 'during beta',
    features: ['All Pro features during beta'],
  },
} as const

export const activeStatuses = new Set(['active', 'trialing'])

export function hasProAccess(plan?: string | null, status?: string | null) {
  if (plan === 'beta' || plan === 'founder') return true
  return plan === 'pro' && !!status && activeStatuses.has(status)
}
