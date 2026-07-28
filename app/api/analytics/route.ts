import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
const allowed = new Set(['account_created','assessment_completed','program_generated','workout_started','set_logged','exercise_replaced','workout_completed','review_completed'])
export async function POST(request: Request){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await request.json(); if(!allowed.has(body.name)) return NextResponse.json({error:'Invalid event'},{status:400});
  const {error}=await supabase.from('analytics_events').insert({user_id:user.id,event_name:body.name,properties:body.properties??{}});
  return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true});
}
