'use client'

import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Loading } from '@/components/shared/loading/loading'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { BreadcrumbProvider } from '@/providers/BreadcrumbContext.tsx'
import { InitPlugSDK } from '@/providers/chatSdk'
import { TooltipProvider } from '@repo/ui/tooltip'
import { enableDevrevChat } from '@repo/dally/auth'
import { QueryProvider } from '@/providers/QueryClientProvider.tsx'

interface ProvidersProps {
  children: ReactNode
}

const publicPages = ['/login', '/verify', '/resend-verify', '/invite', '/subscriber-verify', '/tfa', '/waitlist', '/unsubscribe', '/forgot-password', '/password-reset', '/signup']

const Providers = ({ children }: ProvidersProps) => {
  const { status } = useSession()
  const pathname = usePathname()
  const isPublicPage = publicPages.includes(pathname)

  if (isPublicPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    )
  }

  if (status === 'loading') {
    return <Loading />
  }

  return (
    <NavigationGuardProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryProvider>
          <BreadcrumbProvider>
            {enableDevrevChat === 'true' && <InitPlugSDK />}
            <TooltipProvider disableHoverableContent delayDuration={500} skipDelayDuration={0}>
              {children}
            </TooltipProvider>
          </BreadcrumbProvider>
        </QueryProvider>
      </ThemeProvider>
    </NavigationGuardProvider>
  )
}

export default Providers
