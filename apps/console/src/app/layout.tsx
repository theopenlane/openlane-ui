import type { Metadata } from 'next'
import { outfit, mincho, jetBrainsMono } from '../fonts'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@repo/ui/toaster'
import Providers from './providers'
import './globals.css'
import { pirschAnalyticsKey, recaptchaSiteKey } from '@repo/dally/auth'
import Script from 'next/script'

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
        {recaptchaSiteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} strategy="lazyOnload" />}
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        {pirschAnalyticsKey && <script defer src="https://api.pirsch.io/pa.js" id="pianjs" data-code={pirschAnalyticsKey}></script>}
      </head>
      <body className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full h-screen overscroll-none`}>
        <SessionProvider refetchOnWindowFocus={false}>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
