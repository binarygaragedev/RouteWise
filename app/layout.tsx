import type { Metadata } from 'next'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import './globals.css'

export const metadata: Metadata = {
  title: 'RouteWise AI - Intelligent Rideshare Assistant',
  description: 'Privacy-first AI agents for enhanced rideshare experiences',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}