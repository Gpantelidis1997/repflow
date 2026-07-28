import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const input = z.object({code:z.string().trim().min(6).max(64),email:z.string().email()})
export async function POST(request:Request){
  if((process.env.NEXT_PUBLIC_BETA_MODE ?? 'open') === 'open') return NextResponse.json({valid:true})
  const parsed=input.safeParse(await request.json().catch(()=>null))
  if(!parsed.success) return NextResponse.json({valid:false,error:'Invalid invitation details.'},{status:400})
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  if(!key||!url) return NextResponse.json({valid:false,error:'Invitation service is not configured.'},{status:503})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const {data,error}=await admin.rpc('validate_beta_invite',{invite_code:parsed.data.code,invite_email:parsed.data.email})
  if(error||!data) return NextResponse.json({valid:false,error:'Invitation is invalid, expired or already used.'},{status:403})
  return NextResponse.json({valid:true})
}
