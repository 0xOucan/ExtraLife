import type { Metadata } from 'next'
import './globals.css'
import { initializeDatabase } from '@/lib/database/connection'

export const metadata: Metadata = {
  title: 'Extra Life Insurance',
  description: 'Web3 Insurance powered by MXNB stablecoin',
  generator: 'v0.dev',
}

// Initialize database on startup
initializeDatabase().catch(console.error)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
