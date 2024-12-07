import type { Metadata } from 'next'
import { outfit, mincho, jetBrainsMono } from '../fonts'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@repo/ui/toaster'
import Providers from './providers'
import './globals.css'
import { pirschAnalyticsKey } from '@repo/dally/auth'

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
      <head>
        <script
          async
          src="https://js.stripe.com/v3/pricing-table.js">
        </script>
        {pirschAnalyticsKey && (
          <script defer src="https://api.pirsch.io/pa.js"
            id="pianjs"
            data-code={pirschAnalyticsKey}></script>
        )}
      </head>
      <body
        className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full h-full bg-ziggurat-100 overscroll-none dark:bg-glaucous-950`}
      >
        <SessionProvider>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
