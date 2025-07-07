import { outfit, mincho, jetBrainsMono } from '../fonts'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@repo/ui/toaster'
import Providers from './providers'
import './globals.css'
import { pirschAnalyticsKey, recaptchaSiteKey } from '@repo/dally/auth'
import Script from 'next/script'
import type { Metadata } from 'next'

const imageWidth = '1200'
const imageHeight = '628'
const imageAlt = 'Openlane - Compliance Automation Reimagined'
const imageUrl = `https://imagedelivery.net/2gi-D0CFOlSOflWJG-LQaA/2def713e-2b8b-49c8-f56d-fb19df579200/public`
const description = "Compliance isn't just a checkbox—it's your reputation. Discover Openlane's developer-first compliance platform."
const title = 'Openlane | Streamlining Compliance, Securing Success'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: `%s | ${title}`,
      default: `${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html className="h-screen relative" lang="en" suppressHydrationWarning>
      <head>
        {recaptchaSiteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} strategy="lazyOnload" />}
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        {pirschAnalyticsKey && <script defer src="https://api.pirsch.io/pa.js" id="pianjs" data-code={pirschAnalyticsKey}></script>}
        <Script src={`https://plug-platform.devrev.ai/static/plug.js`} typeof="text/javascript"></Script>
      </head>
      <body className={`${outfit.variable} ${mincho.variable} ${jetBrainsMono.variable} font-sans w-full overscroll-none`}>
        <SessionProvider refetchOnWindowFocus={false}>
          <Providers>{children}</Providers>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
