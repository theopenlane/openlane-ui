import type { Metadata } from 'next'
import { outfit, mincho, jetBrainsMono } from '../fonts'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@repo/ui/toaster'
import Providers from './providers'
import './globals.css'
import { pirschAnalyticsKey, recaptchaSiteKey } from '@repo/dally/auth'
import Script from 'next/script'
import { siteUrl } from '@repo/dally/auth'

const imageWidth = '1200'
const imageHeight = '628'
const imageAlt = 'Openlane - Compliance Automation Reimagined'
const imageUrl = `${siteUrl}/images/joinus.png`
const description = "Because compliance isn't just a checkbox – it's your reputation. Discover Openlane's developer-first compliance platform."
const title = 'Openlane | Streamlining Compliance, Securing Success'

export const metadata: Metadata = {
  title: {
    template: `%s | ${title}`,
    default: `${title}`,
  },
  description: `${description}`,
  openGraph: {
    title: `${title}`,
    description: `${description}`,
    url: 'https://www.theopenlane.io/',
    type: 'website',
    images: [
      {
        url: `${imageUrl}`,
        width: `${imageWidth}`,
        height: `${imageHeight}`,
        alt: `${imageAlt}`,
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html className="h-screen relative" lang="en" suppressHydrationWarning>
      <head>
        {recaptchaSiteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} strategy="lazyOnload" />}
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        {pirschAnalyticsKey && <script defer src="https://api.pirsch.io/pa.js" id="pianjs" data-code={pirschAnalyticsKey}></script>}
      </head>
      <body className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full  overscroll-none`}>
        <SessionProvider refetchOnWindowFocus={false}>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
