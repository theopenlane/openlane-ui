'use client'

import { useCallback, useEffect, useState } from 'react'
import { PRIMARY_DOCUMENT_FIELD, providerSupportsDocumentSync, providerSupportsPrimaryDirectory, providerSupportsTestMessage } from '@/lib/integrations/flow'
import { latestIntegration, readIntegrationUserInput } from '@/lib/integrations/utils'
import { clearPendingIntegrationPrompt, readPendingIntegrationPrompt, writePendingIntegrationPrompt } from '@/lib/integrations/pending-integration-prompt'
import { type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'
import { isOperableIntegration } from '@/lib/integrations/health'

export type IntegrationPromptKind = 'directory' | 'document' | 'test-message'

type UseIntegrationPostConnectPromptOptions = {
  provider: IntegrationProvider | undefined
  canManage: boolean
  installedInstances: IntegrationNode[]
}

const isPromptNeeded = (kind: IntegrationPromptKind, integration: IntegrationNode): boolean => {
  switch (kind) {
    case 'directory':
      return !integration.primaryDirectory
    case 'document':
      return readIntegrationUserInput(integration)[PRIMARY_DOCUMENT_FIELD] !== true
    case 'test-message':
      return isOperableIntegration(integration.status)
  }
}

const resolvePromptKind = (provider: IntegrationProvider | undefined): IntegrationPromptKind | null => {
  if (providerSupportsPrimaryDirectory(provider)) return 'directory'
  if (providerSupportsDocumentSync(provider)) return 'document'
  if (providerSupportsTestMessage(provider)) return 'test-message'
  return null
}

export function useIntegrationPostConnectPrompt({ provider, canManage, installedInstances }: UseIntegrationPostConnectPromptOptions) {
  const [promptIntegration, setPromptIntegration] = useState<IntegrationNode | null>(null)

  const promptKind = resolvePromptKind(provider)

  useEffect(() => {
    if (!provider || !canManage || !promptKind) {
      return
    }

    const pending = readPendingIntegrationPrompt()
    if (!pending || pending.providerId !== provider.id) {
      return
    }

    let target: IntegrationNode | undefined
    if (pending.integrationId) {
      target = installedInstances.find((inst) => inst.id === pending.integrationId)
    } else if (typeof pending.baselineCount === 'number' && installedInstances.length > pending.baselineCount) {
      target = latestIntegration(installedInstances)
    }

    if (!target) {
      return
    }

    clearPendingIntegrationPrompt()
    if (isPromptNeeded(promptKind, target)) {
      setPromptIntegration(target)
    }
  }, [provider, canManage, promptKind, installedInstances])

  const queueAfterRedirect = useCallback((providerId: string, baselineCount: number) => {
    writePendingIntegrationPrompt(providerId, { baselineCount })
  }, [])

  const queueAfterInlineConnect = useCallback((providerId: string, integrationId: string) => {
    writePendingIntegrationPrompt(providerId, { integrationId })
  }, [])

  const dismissPrompt = useCallback(() => setPromptIntegration(null), [])

  return { promptKind, promptIntegration, queueAfterRedirect, queueAfterInlineConnect, dismissPrompt }
}
