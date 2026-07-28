import { expect, it } from 'vitest'
import { calculateAdherence } from '@/lib/engine/adherence'

it('weights partial sessions at fifty percent', () => {
  expect(calculateAdherence(['completed','partial','missed']).percent).toBe(50)
})
