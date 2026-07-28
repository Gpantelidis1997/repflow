import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations/access'
import { buildSession } from '@/lib/session-builder/engine'

const schema = z.object({
  focus: z.enum(['upper','lower','full_body','push','pull']),
  goal: z.enum(['hypertrophy','strength','general_fitness']),
  durationMinutes: z.number().int().min(25).max(90),
  equipment: z.array(z.string()).min(1),
  experience: z.enum(['beginner','intermediate','advanced']),
  contraindicationTags: z.array(z.string()).optional(),
  preferredMuscles: z.array(z.string()).optional(),
  maxFatigueCost: z.number().int().min(1).max(5).optional(),
})

export async function POST(request: Request) {
  const { supabase } = await requireAdmin()
  const constraints = schema.parse(await request.json())
  const { data, error } = await supabase.from('exercises').select('exercise_id,exercise_name,movement_family,primary_muscle,secondary_muscles,equipment,difficulty_level,exercise_role,fatigue_cost,skill_demand,duplicate_cluster,smart_tags,contraindication_tags,generator_enabled,active,estimated_set_seconds,setup_time_seconds').eq('active', true).eq('generator_enabled', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const result = buildSession({ constraints, candidates: data ?? [] })
  await supabase.from('session_generation_runs').insert({ constraints, result, overall_score: result.score.overall, estimated_minutes: result.estimatedMinutes, publishable: result.publishable, engine_version: result.engineVersion })
  return NextResponse.json(result)
}
