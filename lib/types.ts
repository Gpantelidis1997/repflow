export type Goal = 'Build Muscle' | 'Strength and Muscle' | 'General Fitness' | 'Return to Training'
export type Experience = 'Beginner' | 'Early Intermediate' | 'Intermediate'
export type AssessmentInput = {
  goal: Goal
  experience: Experience
  days: 2 | 3 | 4 | 5
  duration: '30–40 minutes' | '45–60 minutes' | '60–75 minutes'
  equipment: 'Commercial Gym' | 'Small Gym' | 'Home Gym' | 'Dumbbells Only'
  priority: 'No Priority' | 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Glutes'
}
export type ExerciseSeed = {
  id:string; name:string; pattern:string; role:string; sets:number; min:number; max:number;
  rest:number; load:number; equipment:string[]; optional?:boolean
}
export type ProgramWorkout = { name:string; exercises: ExerciseSeed[] }
export type GeneratedProgram = { split:string; workouts:ProgramWorkout[]; assessment:AssessmentInput }
export type WorkoutMode = 'full' | 'short'
export type Difficulty = 'Very Easy' | 'Good' | 'Very Hard' | 'Pain'
export type LoggedSet = { id?:string; exerciseId:string; setNumber:number; load:number; reps:number; difficulty:Difficulty }
export type SessionExercise = ExerciseSeed & { originalExerciseId?:string; replacementScope?:'session'|'program' }
