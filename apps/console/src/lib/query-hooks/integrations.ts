import { useNotification } from '@/hooks/useNotification'
import { normalizeDefinition, parseIntegrationErrorMessage } from '@/lib/integrations/utils'
import { type IntegrationProvidersResponse, type RawProvidersResponse } from '@/lib/integrations/types'
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
