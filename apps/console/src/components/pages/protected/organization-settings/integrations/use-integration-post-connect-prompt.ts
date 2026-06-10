'use client'

import { useCallback, useEffect, useState } from 'react'
import { DOCUMENT_FOLDER_FIELD, PRIMARY_DOCUMENT_FIELD } from '@/lib/integrations/flow'
import { latestFinalizedIntegrationForProvider, readIntegrationUserInput } from '@/lib/integrations/utils'
import { clearPendingIntegrationPrompt, readPendingIntegrationPrompt, writePendingIntegrationPrompt } from '@/lib/integrations/pending-integration-prompt'
import { type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'

export type IntegrationPromptKind = 'directory' | 'document'

type UseIntegrationPostConnectPromptOptions = {
  provider: IntegrationProvider | undefined
  canManage: boolean
  supportsPrimaryDirectory: boolean
  supportsDocumentSync: boolean
  installedInstances: IntegrationNode[]
}

const isPromptNeeded = (kind: IntegrationPromptKind, integration: IntegrationNode): boolean => {
  if (kind === 'directory') {
    return !integration.primaryDirectory
  }

  const userInput = readIntegrationUserInput(integration)
  const isPrimary = userInput[PRIMARY_DOCUMENT_FIELD] === true
  const folder = userInput[DOCUMENT_FOLDER_FIELD]
  const hasFolder = typeof folder === 'string' && folder.trim().length > 0

  return !isPrimary || !hasFolder
}

export function useIntegrationPostConnectPrompt({ provider, canManage, supportsPrimaryDirectory, supportsDocumentSync, installedInstances }: UseIntegrationPostConnectPromptOptions) {
  const [promptIntegration, setPromptIntegration] = useState<IntegrationNode | null>(null)

  const promptKind: IntegrationPromptKind | null = supportsPrimaryDirectory ? 'directory' : supportsDocumentSync ? 'document' : null

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
      target = latestFinalizedIntegrationForProvider(installedInstances, provider)
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
