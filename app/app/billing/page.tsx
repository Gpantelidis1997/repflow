import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { plans, hasProAccess } from '@/lib/billing/plans'

export default async function BillingPage({searchParams}:{searchParams:Promise<{plan?:string;success?:string;canceled?:string}>}){
 const params=await searchParams
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
 if(!user) return null
 const {data:subscription}=await supabase.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle()
 const current=plans[(subscription?.plan as keyof typeof plans)||'beta']
 return <main className="container"><div className="eyebrow">Account</div><h1>Billing</h1>{params.success&&<div className="card">Payment completed. Subscription updates may take a few seconds.</div>}{params.canceled&&<div className="card">Checkout canceled. No payment was taken.</div>}<div className="grid two"><section className="card stack"><h2>Current plan</h2><div style={{fontSize:30,fontWeight:800}}>{current.name}</div><p className="muted">Status: {subscription?.status??'active'}</p><p>{hasProAccess(subscription?.plan,subscription?.status)?'Pro features are active.':'Free features are active.'}</p>{subscription?.stripe_customer_id&&<form action="/api/stripe/portal" method="post"><button className="btn">Manage subscription</button></form>}</section><section className="card stack"><h2>Upgrade</h2><p>Unlock all progression, review and program-adjustment features.</p><form action="/api/stripe/checkout" method="post"><input type="hidden" name="plan" value={params.plan==='founder'?'founder':'pro'}/><button className="btn btn-primary">Continue to secure checkout</button></form><Link href="/pricing">Compare plans</Link></section></div></main>
}
