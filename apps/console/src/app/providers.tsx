'use client'

import { Provider as GraphqlProvider } from 'urql'
import { createClient, createSubscriberClient } from '@/lib/urql'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation';

interface ProvidersProps {
  children: any
}

const Providers = ({ children }: ProvidersProps) => {
  const { data: session } = useSession()
  const pathname = usePathname();
  var client = createClient(session)

  // override client for waitlist page
  // this uses an API token instead of the user's credentials
  if (pathname.endsWith("waitlist")) {
    client = createSubscriberClient()
  }

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
