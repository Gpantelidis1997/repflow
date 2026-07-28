import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripeServer } from '@/lib/billing/stripe'

export async function POST(request:Request){
 try{
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.redirect(new URL('/login',request.url),303)
  const form=await request.formData(); const plan=form.get('plan')==='founder'?'founder':'pro'
  const price=plan==='founder'?process.env.STRIPE_FOUNDER_PRICE_ID:process.env.STRIPE_PRO_PRICE_ID
  if(!price) return NextResponse.json({error:'This plan is not configured.'},{status:503})
  const stripe=stripeServer(); const appUrl=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin
  const {data:record}=await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id',user.id).maybeSingle()
  const session=await stripe.checkout.sessions.create({
    mode:plan==='founder'?'payment':'subscription',
    customer:record?.stripe_customer_id||undefined,
    customer_email:record?.stripe_customer_id?undefined:user.email,
    line_items:[{price,quantity:1}],
    success_url:`${appUrl}/app/billing?success=1`, cancel_url:`${appUrl}/app/billing?canceled=1`,
    metadata:{user_id:user.id,plan}, subscription_data:plan==='pro'?{metadata:{user_id:user.id,plan}}:undefined,
  })
  return NextResponse.redirect(session.url!,303)
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Checkout failed.'},{status:500})}
}
