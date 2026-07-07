'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { queryFinalizedIntegrationCountForProvider } from '@/lib/integrations/flow'

const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 2 * 60 * 1000

type PollingState = {
  provider: IntegrationProvider
  baselineCount: number
  startedAt: number
}

export function useInstallationPolling() {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [polling, setPolling] = useState<PollingState | null>(null)
  const pollingRef = useRef(polling)

  useEffect(() => {
    pollingRef.current = polling
  })

  const stopPolling = useCallback(() => setPolling(null), [])

  useEffect(() => {
    if (!polling) {
      return
    }

    const interval = window.setInterval(async () => {
      const current = pollingRef.current
      if (!current) {
        return
      }

      await queryClient.refetchQueries({ queryKey: ['integrations'], type: 'active' })

      const integrationQueries = queryClient.getQueriesData<GetIntegrationsQuery>({ queryKey: ['integrations'] })
      const installedCount = integrationQueries.reduce((maxCount, [, queryData]) => {
        return Math.max(maxCount, queryFinalizedIntegrationCountForProvider(queryData, current.provider))
      }, 0)

      if (installedCount > current.baselineCount) {
        setPolling(null)
        successNotification({ title: 'Integration Connected', description: `${current.provider.displayName} is now connected.` })
        queryClient.invalidateQueries({ queryKey: ['integrations'] })
        return
      }

      if (Date.now() - current.startedAt >= POLL_TIMEOUT_MS) {
        setPolling(null)
        errorNotification({ title: 'Connection Timeout', description: 'The integration flow did not complete. Please try again.' })
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [polling, queryClient, successNotification, errorNotification])

  const startPolling = useCallback((provider: IntegrationProvider, baselineCount: number) => {
    setPolling({ provider, baselineCount, startedAt: Date.now() })
  }, [])

  return { startPolling, stopPolling, isPolling: polling !== null }
}
