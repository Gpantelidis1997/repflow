import { describe, expect, it } from 'vitest'
import { buildSession } from '@/lib/session-builder/engine'
import type { ExerciseCandidate } from '@/lib/exercise-intelligence/types'

const candidate = (id:string,name:string,movement:string,cluster:string,equipment=['dumbbell']):ExerciseCandidate => ({exercise_id:id,exercise_name:name,movement_family:movement,primary_muscle:'general',secondary_muscles:[],equipment,difficulty_level:2,exercise_role:'primary secondary accessory core',fatigue_cost:2,skill_demand:2,duplicate_cluster:cluster,smart_tags:['beginner_friendly'],contraindication_tags:[],generator_enabled:true,active:true})
const catalogue=[candidate('1','DB Press','Horizontal Push','press'),candidate('2','DB Row','Horizontal Pull','row'),candidate('3','DB Shoulder Press','Vertical Push','vertical-press'),candidate('4','Pullover','Vertical Pull','vertical-pull'),candidate('5','Lateral Raise','Shoulder Abduction','lateral'),candidate('6','Curl','Elbow Flexion','curl')]

describe('session builder',()=>{
 it('builds a deterministic upper session without duplicate clusters',()=>{
  const result=buildSession({constraints:{focus:'upper',goal:'hypertrophy',durationMinutes:60,equipment:['dumbbell'],experience:'beginner'},candidates:catalogue})
  expect(result.exercises.length).toBeGreaterThanOrEqual(4)
  const clusters=result.exercises.map(x=>x.exercise.duplicate_cluster)
  expect(new Set(clusters).size).toBe(clusters.length)
  expect(result.engineVersion).toBe('session-builder-v1.0.0')
 })
 it('rejects sessions when required catalogue coverage is missing',()=>{
  const result=buildSession({constraints:{focus:'lower',goal:'strength',durationMinutes:45,equipment:['dumbbell'],experience:'beginner'},candidates:catalogue})
  expect(result.publishable).toBe(false)
  expect(result.issues.some(x=>x.code==='missing_slot_candidate')).toBe(true)
 })
 it('filters exercises that require unavailable equipment',()=>{
  const result=buildSession({constraints:{focus:'upper',goal:'hypertrophy',durationMinutes:60,equipment:['bodyweight'],experience:'beginner'},candidates:catalogue})
  expect(result.exercises).toHaveLength(0)
 })
})
