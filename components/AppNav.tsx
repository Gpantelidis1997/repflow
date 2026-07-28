import Link from 'next/link'

export function AppNav(){
  return <nav className="nav" aria-label="Application navigation">
    <Link href="/app/page">Home</Link>
    <Link href="/app/program">Program</Link>
    <Link href="/app/schedule">Schedule</Link>
    <Link href="/app/review">Review</Link>
    <Link href="/app/progress">Progress</Link>
    <Link href="/app/notifications">Notifications</Link>
    <Link href="/app/profile">Profile</Link>
    <Link href="/app/billing">Billing</Link>
  </nav>
}
