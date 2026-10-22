'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  PRIMARY_DOCUMENT_FIELD,
  providerSupportsDocumentSync,
  providerSupportsPrimaryDirectory,
  providerSupportsResourcePicker,
  providerSupportsTestMessage,
  readSelectedResources,
} from '@/lib/integrations/flow'
import { latestIntegration, readIntegrationUserInput } from '@/lib/integrations/utils'
import { clearPendingIntegrationPrompt, readPendingIntegrationPrompt, writePendingIntegrationPrompt } from '@/lib/integrations/pending-integration-prompt'
import { type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'
import { isOperableIntegration } from '@/lib/integrations/health'
import { useResourcePicker } from './use-resource-picker'

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
  const [pickerIntegration, setPickerIntegration] = useState<IntegrationNode | null>(null)

  const promptKind = resolvePromptKind(provider)
  const supportsResourcePicker = providerSupportsResourcePicker(provider)
  const hasPostConnectStep = promptKind !== null || supportsResourcePicker

  const showPromptIfNeeded = useCallback(
    (integration: IntegrationNode) => {
      if (promptKind && isPromptNeeded(promptKind, integration)) {
        setPromptIntegration(integration)
      }
    },
    [promptKind],
  )

  useEffect(() => {
    if (!provider || !canManage || !hasPostConnectStep) {
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
    if (supportsResourcePicker && isOperableIntegration(target.status) && readSelectedResources(target).length === 0) {
      setPickerIntegration(target)
      return
    }

    showPromptIfNeeded(target)
  }, [provider, canManage, hasPostConnectStep, supportsResourcePicker, showPromptIfNeeded, installedInstances])

  const { chooseResources } = useResourcePicker(provider)

  useEffect(() => {
    if (!pickerIntegration) {
      return
    }

    void chooseResources(pickerIntegration).finally(() => {
      setPickerIntegration((current) => (current?.id === pickerIntegration.id ? null : current))
      showPromptIfNeeded(pickerIntegration)
    })
  }, [pickerIntegration, chooseResources, showPromptIfNeeded])

  const queueAfterRedirect = useCallback((providerId: string, baselineCount: number) => {
    writePendingIntegrationPrompt(providerId, { baselineCount })
  }, [])

  const queueAfterInlineConnect = useCallback((providerId: string, integrationId: string) => {
    writePendingIntegrationPrompt(providerId, { integrationId })
  }, [])

  const dismissPrompt = useCallback(() => setPromptIntegration(null), [])

  const currentPromptIntegration = promptIntegration ? (installedInstances.find((inst) => inst.id === promptIntegration.id) ?? promptIntegration) : null

  return { promptKind, promptIntegration: currentPromptIntegration, hasPostConnectStep, queueAfterRedirect, queueAfterInlineConnect, dismissPrompt }
}
