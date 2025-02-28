'use client'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Loading } from '@/components/shared/loading/loading'
import { getGraphQLClient } from '@/lib/graphql'

interface ProvidersProps {
  children: ReactNode
}

const publicPages = ['/login', '/verify', '/resend-verify', '/invite', '/subscriber-verify', '/tfa']

const Providers = ({ children }: ProvidersProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    if (status === 'authenticated' && !queryClient) {
      setAccessToken(session.user.accessToken)
      const client = getGraphQLClient(session)
      const newQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            queryFn: async ({ queryKey }) => {
              const [query, variables] = queryKey as [string, Record<string, any>?]
              return client.request(query, variables)
            },
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

export default Providers
