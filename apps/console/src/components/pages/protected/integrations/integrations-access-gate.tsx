'use client'

import React from 'react'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useCanManageIntegrations } from '@/lib/authz/use-can-manage-integrations'

const IntegrationsAccessGate = ({ children }: { children: React.ReactNode }) => {
  const { canManageIntegrations, isLoading } = useCanManageIntegrations()

  if (isLoading) {
    return null
  }

  return canManageIntegrations ? children : <ProtectedArea />
}

export default IntegrationsAccessGate
