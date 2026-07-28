import Link from 'next/link'
import { requireAdmin } from '@/lib/operations/access'

export default async function AdminUsersPage(){
  const {supabase}=await requireAdmin()
  const {data:users}=await supabase.from('profiles').select('id,email,role,created_at').order('created_at',{ascending:false}).limit(100)
  const {data:statuses}=await supabase.from('user_account_status').select('user_id,status,reason,changed_at')
  const statusMap=new Map((statuses??[]).map(s=>[s.user_id,s]))
  return <main className="container"><p className="eyebrow">Admin · Users</p><h1>User operations</h1><p className="muted">Operational status is separate from authentication and billing. Restriction actions are auditable.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead><tbody>{(users??[]).map(u=>{const s=statusMap.get(u.id);return <tr key={u.id}><td>{u.email??u.id}</td><td>{u.role}</td><td><span className={s?.status==='suspended'?'pill pill-danger':'pill'}>{s?.status??'active'}</span>{s?.reason&&<div className="muted">{s.reason}</div>}</td><td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td></tr>})}</tbody></table></div><div className="action-row"><Link className="btn btn-secondary button-link" href="/app/admin">Admin home</Link></div></main>
}
