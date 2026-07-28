import Link from 'next/link'
import { plans } from '@/lib/billing/plans'

export default function PricingPage(){
  const shown=[plans.free,plans.pro,plans.founder]
  return <main className="container"><div className="eyebrow">Simple pricing</div><h1>Train with a plan that progresses.</h1><p className="muted">Beta members keep full Pro access while the beta is active.</p><div className="grid three">{shown.map(plan=><section className="card stack" key={plan.key}><div><h2>{plan.name}</h2><div style={{fontSize:34,fontWeight:800}}>{plan.price}</div><div className="muted">{plan.cadence}</div></div><ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul><Link className={`btn ${plan.key==='pro'?'btn-primary':''}`} href={plan.key==='free'?'/signup':`/app/billing?plan=${plan.key}`}>{plan.key==='free'?'Start free':'Choose '+plan.name}</Link></section>)}</div></main>
}
