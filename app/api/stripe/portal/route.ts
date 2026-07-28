import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripeServer } from '@/lib/billing/stripe'

export async function POST(request:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
 if(!user) return NextResponse.redirect(new URL('/login',request.url),303)
 const {data:record}=await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id',user.id).maybeSingle()
 if(!record?.stripe_customer_id) return NextResponse.redirect(new URL('/app/billing',request.url),303)
 const session=await stripeServer().billingPortal.sessions.create({customer:record.stripe_customer_id,return_url:`${process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin}/app/billing`})
 return NextResponse.redirect(session.url,303)
}
