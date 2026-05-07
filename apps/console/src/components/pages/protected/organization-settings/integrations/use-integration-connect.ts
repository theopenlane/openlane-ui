'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { type IntegrationProvider, type IntegrationSchemaNode } from '@/lib/integrations/types'
import { resolveConnectionEntry } from '@/lib/integrations/utils'
import { connectViaAuth, saveIntegrationConfiguration } from '@/lib/integrations/flow'
import { normalizeIntegrationFormPayloads } from '@/lib/integrations/schema'

type WebhookDetails = {
  endpointUrl: string
  secret: string
}

type UseIntegrationConnectOptions = {
  provider: IntegrationProvider | undefined
  credentialSchema: IntegrationSchemaNode | undefined
  userInputSchema: IntegrationSchemaNode | undefined
  credentialRef: string | undefined
  initialValues: Record<string, unknown>
  reset: (values: Record<string, unknown>) => void
  onSuccess?: (result: { integrationId?: string }) => void | Promise<void>
  onRedirect: () => void
}

export function useIntegrationConnect({ provider, credentialSchema, userInputSchema, credentialRef, initialValues, reset, onSuccess, onRedirect }: UseIntegrationConnectOptions) {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [isConnecting, setIsConnecting] = useState(false)
  const [webhookDetails, setWebhookDetails] = useState<WebhookDetails | null>(null)

  const handleAuthConnect = useCallback(async () => {
    if (!provider) {
      return
    }

    setIsConnecting(true)

    try {
      await connectViaAuth(provider, {
        credentialRef,
        onRedirect,
      })
    } catch (error) {
      errorNotification({
        title: `Failed to connect ${provider.displayName}`,
        description: error instanceof Error ? error.message : 'Unexpected error while starting the integration flow.',
      })
    } finally {
      setIsConnecting(false)
    }
  }, [provider, credentialRef, onRedirect, errorNotification])

  const handleSubmit = useCallback(
    async (formValues: Record<string, unknown>) => {
      if (!provider) {
        return
      }

      const { credentialPayload, hasCredentialPayload, hasUserInputPayload, missingRequired, userInputPayload } = normalizeIntegrationFormPayloads(credentialSchema, userInputSchema, formValues)

      if (missingRequired.length > 0) {
        errorNotification({
          title: `Missing required fields for ${provider.displayName}`,
          description: missingRequired.join(', '),
        })
        return
      }

      const selectedConnection = resolveConnectionEntry(provider, credentialRef)
      const connectionHasAuth = selectedConnection?.auth != null

      if (!hasCredentialPayload && !hasUserInputPayload) {
        if (connectionHasAuth) {
          await handleAuthConnect()
          return
        }

        errorNotification({
          title: `No configuration provided`,
          description: `Please fill in the required fields to connect ${provider.displayName}.`,
        })
        return
      }

      try {
        if (connectionHasAuth && Object.keys(credentialSchema?.properties ?? {}).length === 0) {
          await connectViaAuth(provider, {
            credentialRef,
            userInput: userInputPayload.payload,
            onRedirect,
          })

          successNotification({
            title: `Continue connecting ${provider.displayName}`,
            description: `Redirecting to ${provider.displayName} to finish setup.`,
          })
          return
        }

        const configResult = await saveIntegrationConfiguration({
          definitionId: provider.id,
          credentialRef,
          body: credentialPayload.payload,
          userInput: userInputPayload.payload,
        })

        if (configResult.webhookEndpointUrl && configResult.webhookSecret) {
          setWebhookDetails({
            endpointUrl: configResult.webhookEndpointUrl,
            secret: configResult.webhookSecret,
          })
        }

        queryClient.invalidateQueries({ queryKey: ['integrations'] })
        reset(initialValues)
        await onSuccess?.({ integrationId: configResult.integrationId })

        successNotification({
          title: `${provider.displayName} configured`,
          description: 'Integration credentials were saved successfully.',
        })
      } catch (error) {
        errorNotification({
          title: `Failed to configure ${provider.displayName}`,
          description: error instanceof Error ? error.message : 'Unexpected error while saving integration settings.',
        })
      }
    },
    [provider, credentialSchema, userInputSchema, credentialRef, initialValues, onSuccess, onRedirect, reset, queryClient, handleAuthConnect, successNotification, errorNotification],
  )

  return {
    isConnecting,
    webhookDetails,
    dismissWebhookDetails: useCallback(() => setWebhookDetails(null), []),
    handleAuthConnect,
    handleSubmit,
  }
}
