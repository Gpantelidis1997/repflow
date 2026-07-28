import type { SessionConstraints, SessionSlot } from './types'

const slot = (key: string, movementFamily: string, role: SessionSlot['role'], sets: number, repRange: [number, number], restSeconds: number, required = true): SessionSlot => ({ key, movementFamily, role, sets, repRange, restSeconds, required })

export function createSessionSlots(constraints: SessionConstraints): SessionSlot[] {
  const strength = constraints.goal === 'strength'
  const primarySets = strength ? 4 : constraints.experience === 'beginner' ? 3 : 4
  const primaryReps: [number, number] = strength ? [4, 6] : [6, 10]
  const secondaryReps: [number, number] = strength ? [6, 8] : [8, 12]
  const accessoryReps: [number, number] = [10, 15]
  const primaryRest = strength ? 180 : 120

  const maps: Record<SessionConstraints['focus'], SessionSlot[]> = {
    upper: [
      slot('upper-horizontal-push', 'Horizontal Push', 'primary', primarySets, primaryReps, primaryRest),
      slot('upper-horizontal-pull', 'Horizontal Pull', 'primary', primarySets, primaryReps, primaryRest),
      slot('upper-vertical-push', 'Vertical Push', 'secondary', 3, secondaryReps, 90),
      slot('upper-vertical-pull', 'Vertical Pull', 'secondary', 3, secondaryReps, 90),
      slot('upper-shoulder', 'Shoulder Abduction', 'accessory', 3, accessoryReps, 60, false),
      slot('upper-arms', 'Elbow Flexion', 'accessory', 2, accessoryReps, 60, false),
    ],
    lower: [
      slot('lower-knee', 'Knee Dominant', 'primary', primarySets, primaryReps, primaryRest),
      slot('lower-hinge', 'Hip Hinge', 'primary', primarySets, primaryReps, primaryRest),
      slot('lower-single-leg', 'Single Leg', 'secondary', 3, secondaryReps, 90),
      slot('lower-knee-flexion', 'Knee Flexion', 'accessory', 3, accessoryReps, 60, false),
      slot('lower-core', 'Core Anti-extension', 'core', 3, [8, 15], 60, false),
    ],
    full_body: [
      slot('full-knee', 'Knee Dominant', 'primary', primarySets, primaryReps, primaryRest),
      slot('full-push', 'Horizontal Push', 'primary', primarySets, primaryReps, primaryRest),
      slot('full-hinge', 'Hip Hinge', 'secondary', 3, secondaryReps, 90),
      slot('full-pull', 'Horizontal Pull', 'secondary', 3, secondaryReps, 90),
      slot('full-core', 'Core Anti-rotation', 'core', 3, [8, 15], 60, false),
    ],
    push: [
      slot('push-horizontal', 'Horizontal Push', 'primary', primarySets, primaryReps, primaryRest),
      slot('push-vertical', 'Vertical Push', 'primary', primarySets, primaryReps, primaryRest),
      slot('push-incline', 'Incline Push', 'secondary', 3, secondaryReps, 90, false),
      slot('push-shoulder', 'Shoulder Abduction', 'accessory', 3, accessoryReps, 60),
      slot('push-triceps', 'Elbow Extension', 'accessory', 3, accessoryReps, 60),
    ],
    pull: [
      slot('pull-horizontal', 'Horizontal Pull', 'primary', primarySets, primaryReps, primaryRest),
      slot('pull-vertical', 'Vertical Pull', 'primary', primarySets, primaryReps, primaryRest),
      slot('pull-secondary', 'Horizontal Pull', 'secondary', 3, secondaryReps, 90, false),
      slot('pull-biceps', 'Elbow Flexion', 'accessory', 3, accessoryReps, 60),
      slot('pull-core', 'Core Anti-extension', 'core', 3, [8, 15], 60, false),
    ],
  }

  const slots = maps[constraints.focus]
  if (constraints.durationMinutes <= 35) return slots.filter(item => item.required).slice(0, 4)
  if (constraints.durationMinutes <= 50) return slots.slice(0, 5)
  return slots
}
