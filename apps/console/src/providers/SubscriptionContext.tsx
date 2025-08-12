'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SubscriptionState {
  showSubscriptionPage: boolean
  module?: string
  moduleDescription?: string
}

interface SubscriptionContextType {
  subscriptionState: SubscriptionState
  showSubscriptionPage: (module?: string, moduleDescription?: string) => void
  hideSubscriptionPage: () => void
  resetSubscriptionState: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

interface SubscriptionProviderProps {
  children: ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    showSubscriptionPage: false,
    module: 'Security',
    moduleDescription: 'This module offers in-depth security measures. Ready to dive deeper?',
  })

  const showSubscriptionPage = (module: string = 'Security', moduleDescription: string = 'This module offers in-depth security measures. Ready to dive deeper?') => {
    setSubscriptionState({
      showSubscriptionPage: true,
      module,
      moduleDescription,
    })
  }

  const hideSubscriptionPage = () => {
    setSubscriptionState((prev) => ({
      ...prev,
      showSubscriptionPage: false,
    }))
  }

  const resetSubscriptionState = () => {
    setSubscriptionState({
      showSubscriptionPage: false,
      module: 'Security',
      moduleDescription: 'This module offers in-depth security measures. Ready to dive deeper?',
    })
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionState,
        showSubscriptionPage,
        hideSubscriptionPage,
        resetSubscriptionState,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
