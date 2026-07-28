'use client'
export function ReferralCard({ code, count }: { code: string; count: number }) {
  const url = typeof window === 'undefined' ? code : `${window.location.origin}/signup?ref=${code}`
  return <div className="card"><div className="eyebrow">Referral preview</div><h2>Invite training partners</h2><p className="muted">Referral rewards are not active yet. Attribution is ready for a controlled future launch.</p><div className="row"><code className="referral-code">{code}</code><button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(url)}>Copy link</button></div><p className="muted">Successful referrals: {count}</p></div>
}
