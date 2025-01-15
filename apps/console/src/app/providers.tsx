'use client'

import { Provider as GraphqlProvider } from 'urql'
import { Client } from '@urql/core'
import { createClient, createSubscriberClient } from '@/lib/urql'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface ProvidersProps {
  children: ReactNode
}

const Providers = ({ children }: ProvidersProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [client, setClient] = useState<Client | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const tokenChanged = session?.user.accessToken && session?.user.accessToken !== accessToken
    if (status === 'authenticated' && tokenChanged) {
      setAccessToken(session?.user.accessToken)
      setClient(createClient(session))
    } else if (status === 'unauthenticated' && pathname.endsWith('waitlist')) {
      setClient(createSubscriberClient())
    }
  }, [session?.user.accessToken, status, pathname, accessToken])

  if (status === 'loading' || (status === 'authenticated' && !client)) return null

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {client ? <GraphqlProvider value={client}>{children}</GraphqlProvider> : children}
    </ThemeProvider>
  )
}

export default Providers
