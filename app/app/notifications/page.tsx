import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: notifications } = user ? await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50) : { data: [] }
  return <main className="container"><AppNav/><div className="row"><div><div className="eyebrow">Lifecycle</div><h1>Notifications</h1></div><form action="/api/notifications/read" method="post"><button className="btn btn-secondary" type="submit">Mark all read</button></form></div><div className="timeline">{notifications?.length ? notifications.map(item => <article className={`card ${item.read_at ? '' : 'notification-unread'}`} key={item.id}><div className="row"><span className="pill">{String(item.type).replace('_',' ')}</span><span className="muted">{new Date(item.created_at).toLocaleDateString('en-GB')}</span></div><h2>{item.title}</h2><p className="muted">{item.body}</p>{item.action_url && <Link className="btn btn-primary button-link" href={item.action_url}>{item.action_label ?? 'Open'}</Link>}</article>) : <div className="card empty">No notifications yet.</div>}</div></main>
}
