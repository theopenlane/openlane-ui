'use client'

import React, { useState, useEffect } from 'react'
import RequiredSubscription from '@/components/pages/protected/subscription/required-subscription'
import { GraphQLErrorResponse, hasModuleError } from '@/types/graphql-error'

interface SubscriptionWrapperProps {
  children: React.ReactNode
  module: string
  moduleDescription: string
  error?: GraphQLErrorResponse | null
}

const SubscriptionWrapper: React.FC<SubscriptionWrapperProps> = ({ children, module, moduleDescription, error }) => {
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false)

  useEffect(() => {
    if (hasModuleError(error)) {
      setShowSubscriptionPage(true)
      return
    }

    setShowSubscriptionPage(false)
  }, [error])

  return showSubscriptionPage ? (
    <div className="flex items-center justify-center h-full">
      <RequiredSubscription module={module} moduleDescription={moduleDescription} />
    </div>
  ) : (
    <>{children}</>
  )
}

export default SubscriptionWrapper
