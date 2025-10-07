import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GTO Learner',
  description: '德州扑克GTO练习平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
