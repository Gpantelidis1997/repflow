import { describe, expect, it } from 'vitest'
import { automationStatusLabel, automationTone, safeError } from '@/lib/automation/operations'

describe('automation operations helpers', () => {
  it('formats statuses', () => {
    expect(automationStatusLabel('completed')).toBe('Completed')
    expect(automationStatusLabel('queued')).toBe('Queued')
  })
  it('marks terminal states', () => {
    expect(automationTone('completed')).toBe('pill-success')
    expect(automationTone('failed')).toBe('pill-danger')
  })
  it('limits exposed error length', () => {
    expect(safeError(new Error('x'.repeat(900))).length).toBe(500)
  })
})
