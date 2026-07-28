import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripeServer } from '@/lib/billing/stripe'
import type Stripe from 'stripe'

function admin(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}
export async function POST(request:Request){
 const signature=request.headers.get('stripe-signature'); const secret=process.env.STRIPE_WEBHOOK_SECRET
 if(!signature||!secret) return NextResponse.json({error:'Webhook unavailable.'},{status:503})
 const body=await request.text(); let event:Stripe.Event
 try{event=stripeServer().webhooks.constructEvent(body,signature,secret)}catch{return NextResponse.json({error:'Invalid signature.'},{status:400})}
 const db=admin(); const {error:seenError}=await db.from('billing_events').insert({stripe_event_id:event.id,event_type:event.type,payload:event as unknown as Record<string,unknown>})
 if(seenError?.code==='23505') return NextResponse.json({received:true,duplicate:true})
 try{
  if(event.type==='checkout.session.completed'){
   const session=event.data.object as Stripe.Checkout.Session; const userId=session.metadata?.user_id; const plan=session.metadata?.plan
   if(userId) await db.from('subscriptions').upsert({user_id:userId,stripe_customer_id:String(session.customer||''),stripe_subscription_id:session.subscription?String(session.subscription):null,plan:plan==='founder'?'founder':'pro',status:'active',updated_at:new Date().toISOString()},{onConflict:'user_id'})
  }
  if(event.type.startsWith('customer.subscription.')){
   const sub=event.data.object as Stripe.Subscription; const userId=sub.metadata.user_id
   if(userId) await db.from('subscriptions').upsert({user_id:userId,stripe_customer_id:String(sub.customer),stripe_subscription_id:sub.id,stripe_price_id:sub.items.data[0]?.price.id,plan:'pro',status:sub.status,current_period_end:new Date(sub.current_period_end*1000).toISOString(),cancel_at_period_end:sub.cancel_at_period_end,updated_at:new Date().toISOString()},{onConflict:'user_id'})
  }
  return NextResponse.json({received:true})
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Processing failed.'},{status:500})}
}
