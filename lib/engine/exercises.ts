import type { ExerciseSeed } from '@/lib/types'

export const EXERCISES: ExerciseSeed[] = [
  {id:'machine_chest_press',name:'Machine Chest Press',pattern:'Horizontal Push',role:'Primary Compound',sets:3,min:8,max:12,rest:150,load:50,equipment:['Commercial Gym','Small Gym']},
  {id:'dumbbell_bench_press',name:'Dumbbell Bench Press',pattern:'Horizontal Push',role:'Primary Compound',sets:3,min:8,max:12,rest:150,load:20,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'lat_pulldown',name:'Lat Pulldown',pattern:'Vertical Pull',role:'Primary Compound',sets:3,min:8,max:12,rest:150,load:50,equipment:['Commercial Gym','Small Gym']},
  {id:'one_arm_dumbbell_row',name:'One-Arm Dumbbell Row',pattern:'Horizontal Pull',role:'Secondary Compound',sets:3,min:8,max:12,rest:120,load:22,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'machine_shoulder_press',name:'Machine Shoulder Press',pattern:'Vertical Push',role:'Primary Compound',sets:3,min:8,max:12,rest:150,load:30,equipment:['Commercial Gym','Small Gym']},
  {id:'dumbbell_lateral_raise',name:'Dumbbell Lateral Raise',pattern:'Shoulder Abduction',role:'Isolation',sets:3,min:12,max:20,rest:75,load:7,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'leg_press',name:'Leg Press',pattern:'Knee-Dominant',role:'Primary Compound',sets:3,min:8,max:15,rest:180,load:120,equipment:['Commercial Gym','Small Gym']},
  {id:'goblet_squat',name:'Goblet Squat',pattern:'Knee-Dominant',role:'Primary Compound',sets:3,min:8,max:15,rest:150,load:24,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'dumbbell_romanian_deadlift',name:'Dumbbell Romanian Deadlift',pattern:'Hip Hinge',role:'Primary Compound',sets:3,min:8,max:12,rest:150,load:30,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'reverse_lunge',name:'Reverse Lunge',pattern:'Unilateral',role:'Secondary Compound',sets:3,min:8,max:12,rest:120,load:14,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']},
  {id:'seated_leg_curl',name:'Seated Leg Curl',pattern:'Knee Flexion',role:'Isolation',sets:3,min:10,max:15,rest:75,load:35,equipment:['Commercial Gym','Small Gym']},
  {id:'front_plank',name:'Front Plank',pattern:'Anti-Extension',role:'Core',sets:3,min:20,max:60,rest:60,load:0,equipment:['Commercial Gym','Small Gym','Home Gym','Dumbbells Only']}
]
