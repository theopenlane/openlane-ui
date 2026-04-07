import { useNotification } from '@/hooks/useNotification'
import { normalizeDefinition, parseIntegrationErrorMessage, HEALTH_CHECK_STALE_TIME_MS } from '@/lib/integrations/utils'
import { type IntegrationProvidersResponse, type RawProvidersResponse } from '@/lib/integrations/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

type HealthResponse = {
  status?: string
  summary?: string
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

export const useIntegrationHealth = (integrationId?: string, enabled = true) => {
  return useQuery<HealthResponse>({
    queryKey: ['integrationHealth', integrationId],
    queryFn: async () => {
      const res = await fetch('/api/integrations/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      })
      if (!res.ok) {
        throw new Error(await parseIntegrationErrorMessage(res))
      }
      return (await res.json()) as HealthResponse
    },
    enabled: Boolean(integrationId && enabled),
    staleTime: HEALTH_CHECK_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
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
