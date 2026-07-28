import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/server'
import { ReferralCard } from './referrals'

export default async function Profile(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: referral } = user
    ? await supabase.from('referral_codes').select('code,successful_referrals').eq('owner_user_id', user.id).maybeSingle()
    : { data: null }

  return <main className="container">
    <AppNav/>
    <div className="eyebrow">Profile</div>
    <h1>Training preferences</h1>
    <div className="card"><p className="muted">Goal, schedule, equipment and limitations will be editable here.</p></div>
    {referral && <ReferralCard code={referral.code} count={referral.successful_referrals}/>} 
  </main>
}
