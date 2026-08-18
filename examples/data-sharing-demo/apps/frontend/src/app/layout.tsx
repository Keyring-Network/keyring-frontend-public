import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Keyring Data Sharing Demo',
  description: 'Demo application for Keyring Data Sharing SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
          {children}
        </main>
      </body>
    </html>
  )
}
