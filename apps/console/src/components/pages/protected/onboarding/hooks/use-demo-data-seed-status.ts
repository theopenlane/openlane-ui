'use client'

import { useEffect, useState } from 'react'
import { DEMO_DATA_POLL_INTERVAL_MS, DEMO_DATA_SEED_JOB, type TDemoDataJobResult, useDemoDataJobWatch } from '@/hooks/useDemoDataJobWatch'
import { getDemoDataSeedOutcome, useDemoDataPresence } from '@/lib/graphql-hooks/demo-data'
import { useNotificationsContext } from '@/providers/notifications-provider'

export type TDemoDataSeedStatus = 'pending' | TDemoDataJobResult

type TDemoDataSeedStatusOptions = {
  requestedAt: number | null
  isWorkspaceReady: boolean
}

export const useDemoDataSeedStatus = ({ requestedAt, isWorkspaceReady }: TDemoDataSeedStatusOptions): TDemoDataSeedStatus | undefined => {
  const { liveNotifications } = useNotificationsContext()
  const [result, setResult] = useState<TDemoDataJobResult | null>(null)
  const isPending = requestedAt !== null && isWorkspaceReady && !result

  const { data: presence, dataUpdatedAt } = useDemoDataPresence({ enabled: isPending, refetchInterval: isPending ? DEMO_DATA_POLL_INTERVAL_MS : false })
  useDemoDataJobWatch({ job: isPending ? DEMO_DATA_SEED_JOB : null, presence, presenceUpdatedAt: dataUpdatedAt, onFinish: setResult })

  useEffect(() => {
    if (!isPending || requestedAt === null) return
    const bufferedOutcome = liveNotifications
      .filter((notification) => notification.createdAt != null && new Date(notification.createdAt).getTime() >= requestedAt)
      .map(getDemoDataSeedOutcome)
      .find((outcome) => outcome !== null)
    if (bufferedOutcome) setResult(bufferedOutcome)
  }, [isPending, liveNotifications, requestedAt])

  if (requestedAt === null) return undefined
  return result ?? 'pending'
}
