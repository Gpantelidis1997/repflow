'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Signup(){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [invite,setInvite]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false)
 const inviteMode=process.env.NEXT_PUBLIC_BETA_MODE==='invite'
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('')
  if(inviteMode){const response=await fetch('/api/beta/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:invite,email})});const result=await response.json();if(!response.ok){setLoading(false);return setError(result.error??'Invalid invitation.')}}
  const {error}=await createClient().auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/auth/callback?next=/assessment`,data:{beta_invite_code:invite||null}}})
  setLoading(false);if(error)return setError(error.message);location.assign('/verify-email')
 }
 return <main className="container" style={{maxWidth:520}}><div className="eyebrow">RepFlow Beta</div><h1>Create your account</h1><form className="card stack" onSubmit={submit}><input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input className="input" type="password" minLength={8} placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required/>{inviteMode&&<input className="input" placeholder="Beta invitation code" value={invite} onChange={e=>setInvite(e.target.value)} required/>}{error&&<p style={{color:'var(--red)'}}>{error}</p>}<label style={{fontSize:13}}><input type="checkbox" required/> I agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</label><button className="btn btn-primary" disabled={loading}>{loading?'Creating account...':'Create account'}</button></form></main>
}
