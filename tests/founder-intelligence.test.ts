import { describe, expect, it } from 'vitest'
import { eurosFromCents, healthLabel, percentage } from '@/lib/intelligence/founder'

describe('founder intelligence helpers', () => {
  it('formats euro cents', () => expect(eurosFromCents(342000)).toContain('3.420'))
  it('avoids division by zero', () => expect(percentage(0, 0)).toBe('0%'))
  it('does not claim unknown services are healthy', () => expect(healthLabel(null)).toBe('Unknown'))
})
