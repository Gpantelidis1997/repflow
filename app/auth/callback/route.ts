import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(request:Request){
 const {searchParams,origin}=new URL(request.url);const code=searchParams.get('code');const next=searchParams.get('next')||'/assessment'
 if(code){const {error}=await (await createClient()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(`${origin}${next.startsWith('/')?next:'/assessment'}`)}
 return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
