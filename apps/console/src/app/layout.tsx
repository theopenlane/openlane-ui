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

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html className="h-screen relative" lang="en" suppressHydrationWarning>
      <head>
        {/* <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDINrXyQzJvFUbJbok_tByEmOm4WrafdAw&libraries=places"></script> */}

        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        {pirschAnalyticsKey && <script defer src="https://api.pirsch.io/pa.js" id="pianjs" data-code={pirschAnalyticsKey}></script>}
      </head>
      <body className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full h-screen overscroll-none`}>
        <SessionProvider>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
