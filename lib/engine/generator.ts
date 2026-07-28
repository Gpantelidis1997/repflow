import { EXERCISES } from './exercises'
import type { AssessmentInput, GeneratedProgram } from '@/lib/types'

const select = (equipment: AssessmentInput['equipment'], patterns: string[]) => {
  const pool = EXERCISES.filter(e => e.equipment.includes(equipment))
  return patterns.map(pattern => pool.find(e => e.pattern === pattern)).filter(Boolean) as typeof EXERCISES
}

export function generateProgram(assessment: AssessmentInput): GeneratedProgram {
  const split = assessment.days === 2 ? 'Full Body' : assessment.days === 3 ? 'Full / Upper / Lower' : assessment.days === 4 ? 'Upper / Lower' : 'Upper / Lower Hybrid'
  const upper = select(assessment.equipment,['Horizontal Push','Vertical Pull','Horizontal Pull','Vertical Push','Shoulder Abduction'])
  const lower = select(assessment.equipment,['Knee-Dominant','Hip Hinge','Unilateral','Knee Flexion','Anti-Extension'])
  const full = [...upper.slice(0,3),...lower.slice(0,3)]
  const templates = assessment.days === 2
    ? [['Full Body A',full],['Full Body B',[...full].reverse()]]
    : assessment.days === 3
      ? [['Full Body',full],['Upper',upper],['Lower',lower]]
      : assessment.days === 4
        ? [['Upper A',upper],['Lower A',lower],['Upper B',[...upper].reverse()],['Lower B',[...lower].reverse()]]
        : [['Upper A',upper],['Lower A',lower],['Upper B',[...upper].reverse()],['Lower B',[...lower].reverse()],['Upper C',upper]]
  return { split, assessment, workouts: templates.map(([name, exercises]) => ({ name: name as string, exercises: exercises as typeof EXERCISES })) }
}
