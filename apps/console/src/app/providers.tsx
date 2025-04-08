'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Loading } from '@/components/shared/loading/loading'
import { NavigationGuardProvider } from 'next-navigation-guard'

interface ProvidersProps {
  children: ReactNode
}

const publicPages = ['/login', '/verify', '/resend-verify', '/invite', '/subscriber-verify', '/tfa', '/waitlist', '/unsubscribe']

const Providers = ({ children }: ProvidersProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    if (status === 'authenticated' && !queryClient) {
      setAccessToken(session.user.accessToken)

      const newQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            placeholderData: (prev: any) => prev,
            refetchOnWindowFocus: false,
          },
        },
      })
      setQueryClient(newQueryClient)
    }
  }, [session?.user.accessToken, status, accessToken])

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
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </NavigationGuardProvider>
  )
}

export default Providers
