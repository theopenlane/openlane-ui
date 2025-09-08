'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [client] = React.useState(() => {
    const handleError = (error: unknown) => {
      if (error && typeof error === 'object') {
        const errObj = error as any

        const missingModule1 = errObj?.response?.extensions?.missing_module
        console.log(errObj?.response)
        if (missingModule1) {
          router.push(`/subscription?name=${missingModule1}`)
          return
        }

        const errorsArray = errObj?.response?.errors
        if (Array.isArray(errorsArray)) {
          for (const e of errorsArray) {
            const moduleName = e?.extensions?.module
            if (moduleName) {
              router.push(`/subscription?name=${moduleName}`)
              return
            }
          }
        }
      }
    }

    return new QueryClient({
      queryCache: new QueryCache({ onError: handleError }),
      mutationCache: new MutationCache({ onError: handleError }),
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          placeholderData: (prev: unknown) => prev,
          refetchOnWindowFocus: false,
        },
      },
    })
  })

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
