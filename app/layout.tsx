import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RepFlow',
  description: 'Personalised gym programming with clear next targets.'
}

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>
}
