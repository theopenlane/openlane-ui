import { useNotification } from '@/hooks/useNotification'
import { normalizeDefinition, parseIntegrationErrorMessage } from '@/lib/integrations/utils'
import {
  type IntegrationChannelsList,
  type IntegrationMessageTeam,
  type IntegrationProvider,
  type IntegrationProvidersResponse,
  type IntegrationSelectedResource,
  type IntegrationTestMessageResult,
  type IntegrationChannelTarget,
  type RawProvidersResponse,
} from '@/lib/integrations/types'
import { CHANNELS_LIST_OPERATION, PICKER_SESSION_OPERATION, RESOURCE_SELECTION_OPERATION, TEST_MESSAGE_SEND_OPERATION, runIntegrationOperation, toChannelSelection } from '@/lib/integrations/flow'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { isRecord } from '@/utils/type-guards'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { reportSSORequirementFromResponse } from '@/lib/auth/utils/session-status'

export type IntegrationConnectionHealth = {
  healthy: boolean
  reason?: string
}

export type IntegrationOperationHealth = {
  name: string
  healthy: boolean
  reason?: string
}

export type IntegrationHealthResponse = {
  status?: string
  connection?: IntegrationConnectionHealth
  operations?: IntegrationOperationHealth[]
}

type DisconnectResponse = {
  message?: string
  deletedId?: string
  redirectUrl?: string
  details?: unknown
}

export const useIntegrationProviders = () => {
  const { errorNotification } = useNotification()

  const resp = useQuery<IntegrationProvidersResponse>({
    queryKey: ['integrationProviders'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/providers', {
        method: 'GET',
      })

      if (!res.ok) {
        await reportSSORequirementFromResponse(res)

        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to fetch integration providers')
      }

      const raw: RawProvidersResponse = await res.json()

      return {
        success: raw.success,
        providers: (raw.providers ?? []).map(normalizeDefinition),
      }
    },
  })

  useEffect(() => {
    if (resp.isError) {
      errorNotification({
        title: 'Error occurred while fetching integration providers',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])

  return resp
}

const describeUnhealthyOperations = (operations: IntegrationOperationHealth[]): string => operations.map((operation) => `${operation.name}: ${operation.reason ?? 'unhealthy'}`).join('\n')

export const useIntegrationHealthCheck = () => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  return useMutation<IntegrationHealthResponse, Error, string>({
    mutationFn: async (integrationId: string) => {
      const res = await fetch('/api/integrations/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      })
      if (!res.ok) {
        throw new Error(await parseIntegrationErrorMessage(res))
      }
      return (await res.json()) as IntegrationHealthResponse
    },
    onSuccess: (result) => {
      if (result.connection && !result.connection.healthy) {
        errorNotification({
          title: 'Health Check Failed',
          description: result.connection.reason || 'The integration connection is no longer valid.',
        })

        return
      }

      const unhealthyOperations = (result.operations ?? []).filter((operation) => !operation.healthy)

      if (unhealthyOperations.length > 0) {
        errorNotification({
          title: 'Integration Degraded',
          description: describeUnhealthyOperations(unhealthyOperations),
        })

        return
      }

      successNotification({
        title: 'Health Check Passed',
        description: 'The connection and all operations are healthy.',
      })
    },
    onError: (error) => {
      errorNotification({
        title: 'Health Check Failed',
        description: error instanceof Error ? error.message : 'Unexpected error while checking integration health.',
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      })

      if (!response.ok) {
        throw new Error(await parseIntegrationErrorMessage(response))
      }

      return (await response.json()) as DisconnectResponse
    },
    onSuccess: (result, _integrationId) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({
        title: 'Integration Disconnected',
        description: result.message ?? 'Integration has been disconnected.',
      })

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (error) => {
      errorNotification({
        title: 'Failed to Disconnect',
        description: error instanceof Error ? error.message : 'Unexpected error while disconnecting integration.',
      })
    },
  })
}

export type UseIntegrationChannelsOptions = {
  enabled?: boolean
  staleTime?: number
}

export const useIntegrationChannels = (integrationId: string, { enabled = true, staleTime }: UseIntegrationChannelsOptions = {}) =>
  useQuery<IntegrationMessageTeam[]>({
    queryKey: ['integrationChannels', integrationId],
    enabled,
    staleTime,
    queryFn: async ({ signal }) => {
      const result = await runIntegrationOperation<IntegrationChannelsList>({ integrationId, operation: CHANNELS_LIST_OPERATION, signal })
      return result.details?.teams ?? []
    },
    placeholderData: undefined,
    retry: false,
  })

type SendTestMessageVariables = {
  integrationId: string
  target: IntegrationChannelTarget
}

export const useSendIntegrationTestMessage = () => {
  const { errorNotification } = useNotification()

  return useMutation<IntegrationTestMessageResult, Error, SendTestMessageVariables>({
    mutationFn: ({ integrationId, target }) => runIntegrationOperation({ integrationId, operation: TEST_MESSAGE_SEND_OPERATION, config: target }),
    onError: (error) => {
      errorNotification({
        title: 'Failed to send test message',
        description: error.message || 'Unexpected error while sending the test message. Please try again later.',
      })
    },
  })
}

export const fetchIntegrationPickerSession = async (integrationId: string): Promise<Record<string, unknown>> => {
  const { details } = await runIntegrationOperation<unknown>({ integrationId, operation: PICKER_SESSION_OPERATION })

  if (!isRecord(details)) {
    throw new UserFacingError('The document picker could not be opened for this installation. Please try again later.')
  }

  return details
}

type SaveResourceSelectionVariables = {
  integrationId: string
  resources: IntegrationSelectedResource[]
}

const saveResourceSelection = ({ integrationId, resources }: SaveResourceSelectionVariables) =>
  runIntegrationOperation({ integrationId, operation: RESOURCE_SELECTION_OPERATION, config: { resources } })

export const useSaveIntegrationResourceSelection = () => {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, SaveResourceSelectionVariables>({
    mutationFn: saveResourceSelection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

type SaveDefaultChannelVariables = {
  integrationId: string
  provider: IntegrationProvider | undefined
  channel?: IntegrationChannelTarget & { name: string }
}

export const useSaveIntegrationDefaultChannel = () => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  return useMutation<unknown, Error, SaveDefaultChannelVariables>({
    mutationFn: ({ integrationId, provider, channel }) => saveResourceSelection({ integrationId, resources: toChannelSelection(provider, channel) }),
    onSuccess: (_, { channel }) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification(
        channel
          ? { title: 'Default channel set', description: `Messages without a channel will post to ${channel.name}.` }
          : { title: 'Default channel cleared', description: 'Messages without a channel no longer post to the channel you chose.' },
      )
    },
    onError: (error) => {
      errorNotification({
        title: 'Failed to update the default channel',
        description: error.message || 'Unexpected error while saving the default channel. Please try again later.',
      })
    },
  })
}
