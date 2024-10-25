'use client'

import { Provider as GraphqlProvider } from 'urql'
import { createClient } from '@/lib/urql'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'

interface ProvidersProps {
  children: any
}

const Providers = ({ children }: ProvidersProps) => {
  const { data: session } = useSession()
  const client = createClient(session)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GraphqlProvider value={client}>{children}</GraphqlProvider>
    </ThemeProvider>
  )
}

export default Providers
