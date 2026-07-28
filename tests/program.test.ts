import { describe, expect, it } from 'vitest'
import { replaceExerciseInProgram, shouldRegenerateProgram } from '@/lib/engine/program'
import type { GeneratedProgram, SessionExercise } from '@/lib/types'

const program: GeneratedProgram = {
  split: 'Upper / Lower',
  assessment: {
    goal: 'Build Muscle', experience: 'Beginner', days: 4,
    duration: '45–60 minutes', equipment: 'Commercial Gym', priority: 'No Priority',
  },
  workouts: [{ name: 'Upper A', exercises: [{
    id: 'machine_chest_press', name: 'Machine Chest Press', pattern: 'Horizontal Push',
    role: 'Primary Compound', sets: 3, min: 8, max: 12, rest: 150, load: 40, equipment: ['Machine'],
  }] }],
}

it('creates a new programme payload without mutating the source', () => {
  const replacement: SessionExercise = {
    id: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', pattern: 'Horizontal Push',
    role: 'Primary Compound', sets: 3, min: 8, max: 12, rest: 150, load: 16, equipment: ['Dumbbell','Bench'],
  }
  const result = replaceExerciseInProgram(program, 'machine_chest_press', replacement)
  expect(result.changed).toBe(true)
  expect(result.program.workouts[0].exercises[0].id).toBe('dumbbell_bench_press')
  expect(program.workouts[0].exercises[0].id).toBe('machine_chest_press')
})

it('regenerates only for major changes or excessive replacements', () => {
  expect(shouldRegenerateProgram({ replacementCount: 1 })).toBe(false)
  expect(shouldRegenerateProgram({ replacementCount: 4 })).toBe(true)
  expect(shouldRegenerateProgram({ equipmentChanged: true })).toBe(true)
})
