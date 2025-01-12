'use client'

import { Provider as GraphqlProvider } from 'urql'
import { createClient, createSubscriberClient } from '@/lib/urql'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'

interface ProvidersProps {
  children: any
}

const Providers = ({ children }: ProvidersProps) => {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    if (status === 'authenticated' && !client) {
      setClient(createClient(session))
    } else if (status === 'unauthenticated' && pathname.endsWith('waitlist')) {
      setClient(createSubscriberClient())
    }
  }, [session, status, pathname])

  console.log('status', status)
  if (status === 'loading') return null
  if (status === 'authenticated' && !client) return null
  console.log('client', client)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <GraphqlProvider value={client}>{children}</GraphqlProvider>
    </ThemeProvider>
  )
}

export default Providers
