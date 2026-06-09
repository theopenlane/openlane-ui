'use client'

import { useCallback, useEffect, useState } from 'react'
import { latestFinalizedIntegrationForProvider } from '@/lib/integrations/utils'
import { clearPendingPrimaryDirectoryPrompt, readPendingPrimaryDirectoryPrompt, writePendingPrimaryDirectoryPrompt } from '@/lib/integrations/pending-primary-directory'
import { type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'

type UsePrimaryDirectoryPromptOptions = {
  provider: IntegrationProvider | undefined
  canManage: boolean
  supportsPrimaryDirectory: boolean
  installedInstances: IntegrationNode[]
}

export function usePrimaryDirectoryPrompt({ provider, canManage, supportsPrimaryDirectory, installedInstances }: UsePrimaryDirectoryPromptOptions) {
  const [promptIntegration, setPromptIntegration] = useState<IntegrationNode | null>(null)

  useEffect(() => {
    if (!provider || !canManage || !supportsPrimaryDirectory) {
      return
    }

    const pending = readPendingPrimaryDirectoryPrompt()
    if (!pending || pending.providerId !== provider.id) {
      return
    }

    let target: IntegrationNode | undefined
    if (pending.integrationId) {
      target = installedInstances.find((inst) => inst.id === pending.integrationId)
    } else if (typeof pending.baselineCount === 'number' && installedInstances.length > pending.baselineCount) {
      target = latestFinalizedIntegrationForProvider(installedInstances, provider)
    }

    if (!target) {
      return
    }

    clearPendingPrimaryDirectoryPrompt()
    if (!target.primaryDirectory) {
      setPromptIntegration(target)
    }
  }, [provider, canManage, supportsPrimaryDirectory, installedInstances])

  const queueAfterRedirect = useCallback((providerId: string, baselineCount: number) => {
    writePendingPrimaryDirectoryPrompt(providerId, { baselineCount })
  }, [])

  const queueAfterInlineConnect = useCallback((providerId: string, integrationId: string) => {
    writePendingPrimaryDirectoryPrompt(providerId, { integrationId })
  }, [])

  const dismissPrompt = useCallback(() => setPromptIntegration(null), [])

  return { promptIntegration, queueAfterRedirect, queueAfterInlineConnect, dismissPrompt }
}
