import { describe, expect, it } from 'vitest'
import { compatibilityScore, rankExercises } from '@/lib/exercise-intelligence/rank'
const exercises:any[]=[
 {exercise_id:'bench',exercise_name:'Bench Press',movement_family:'horizontal_push',primary_muscle:'Chest',secondary_muscles:['Triceps'],equipment:['Barbell','Bench'],difficulty_level:3,exercise_role:'Primary Compound',fatigue_cost:4,skill_demand:3,duplicate_cluster:'bench_press',active:true,generator_enabled:true},
 {exercise_id:'machine',exercise_name:'Machine Press',movement_family:'horizontal_push',primary_muscle:'Chest',secondary_muscles:['Triceps'],equipment:['Machine'],difficulty_level:1,exercise_role:'Primary Compound',fatigue_cost:2,skill_demand:1,duplicate_cluster:'machine_press',active:true,generator_enabled:true},
 {exercise_id:'row',exercise_name:'Cable Row',movement_family:'horizontal_pull',primary_muscle:'Back',equipment:['Cable'],difficulty_level:1,exercise_role:'Primary Compound',active:true,generator_enabled:true}
]
describe('exercise intelligence',()=>{
 it('filters unavailable equipment and ranks exact movement',()=>{const ranked=rankExercises(exercises,{movementFamily:'horizontal_push',equipment:['Machine'],maxDifficulty:2});expect(ranked.map(x=>x.exercise_id)).toEqual(['machine'])})
 it('prevents duplicate clusters',()=>{const ranked=rankExercises(exercises,{movementFamily:'horizontal_push',equipment:['Barbell','Bench','Machine'],excludedClusters:['bench_press']});expect(ranked.some(x=>x.exercise_id==='bench')).toBe(false)})
 it('scores same-pattern alternatives above unrelated exercises',()=>{expect(compatibilityScore(exercises[0],exercises[1])).toBeGreaterThan(compatibilityScore(exercises[0],exercises[2]))})
})