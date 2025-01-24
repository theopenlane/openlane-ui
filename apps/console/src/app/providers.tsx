'use client'

import { Provider as GraphqlProvider } from 'urql'
import { Client } from '@urql/core'
import { createClient, createSubscriberClient } from '@/lib/urql'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Loading } from '@/components/shared/loading/loading'

interface ProvidersProps {
  children: ReactNode
}

//IF YOU ADD PUBLIC PAGE, ITS REQUIRED TO CHANGE IT IN middleware.tsx waitlists page needs provider
const publicPages = ['/login', '/verify', '/resend-verify', '/invite', '/subscriber-verify']

const Providers = ({ children }: ProvidersProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [client, setClient] = useState<Client | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    const tokenChanged = session?.user.accessToken && session?.user.accessToken !== accessToken

    if (status === 'authenticated' && tokenChanged) {
      setAccessToken(session?.user.accessToken)
      setClient(createClient(session))
    } else if (status === 'unauthenticated' && pathname.endsWith('waitlist')) {
      setClient(createSubscriberClient())
    }
  }, [session?.user.accessToken, status, pathname, accessToken])

  if (status === 'loading') {
    return <Loading />
  }

  if (isPublicPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    )
  }

  if (!client) {
    return <Loading />
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <GraphqlProvider value={client}>{children}</GraphqlProvider>
    </ThemeProvider>
  )
}

export default Providers
