'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Loading } from '@/components/shared/loading/loading'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { BreadcrumbProvider } from '@/providers/BreadcrumbContext.tsx'
import { InitPlugSDK } from '@/providers/chatSdk'
import { TooltipProvider } from '@repo/ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

const publicPages = ['/login', '/verify', '/resend-verify', '/invite', '/subscriber-verify', '/tfa', '/waitlist', '/unsubscribe', '/forgot-password', '/password-reset', '/signup']
const Providers = ({ children }: ProvidersProps) => {
  const { status } = useSession()
  const pathname = usePathname()
  const isPublicPage = publicPages.includes(pathname)
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      queryClient?.clear()
    }
  }, [status, queryClient])

  useEffect(() => {
    setQueryClient(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            placeholderData: (prev: unknown) => prev,
            refetchOnWindowFocus: false,
          },
        },
      }),
    )
  }, [])

  if (isPublicPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    )
  }

  if (!queryClient) {
    return <Loading />
  }

  return (
    <NavigationGuardProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <BreadcrumbProvider>
            <InitPlugSDK />
            <TooltipProvider disableHoverableContent delayDuration={500} skipDelayDuration={0}>
              {children}
            </TooltipProvider>
          </BreadcrumbProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </NavigationGuardProvider>
  )
}

export default Providers
