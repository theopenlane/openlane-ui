import type { Metadata } from 'next'
import { outfit, mincho, jetBrainsMono} from '../fonts'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@repo/ui/toaster'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Openlane | Compliance made simple',
    default: 'Console | Openlane | Compliance made simple',
  },
  description: 'Accelerate your security and compliance programs with Openlane.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html className="h-full relative" lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full h-full bg-ziggurat-100 overscroll-none dark:bg-oxford-blue-900`}
      >
        <SessionProvider>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
