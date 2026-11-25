'use client'

import { useEffect, useRef } from 'react'
import { type TDemoDataTypeKey } from '@/constants/demo-data-types'
import { getDemoDataSeedOutcome, type TDemoDataPresence, type TDemoDataSeedOutcome } from '@/lib/graphql-hooks/demo-data'
import { type Notification } from '@/lib/graphql-hooks/notifications'
import { useNotificationsContext } from '@/providers/notifications-provider'

export const DEMO_DATA_POLL_INTERVAL_MS = 5000 // 5s
const DEMO_DATA_WAIT_MS = 10 * 60 * 1000 // 10min

export type TDemoDataJobResult = TDemoDataSeedOutcome | 'timed-out'

export type TDemoDataJob = {
  action: 'seed' | 'delete'
  matchOutcome: (notification: Notification) => TDemoDataSeedOutcome | null
  isSettled: (presence: TDemoDataPresence) => boolean
}

export const DEMO_DATA_SEED_JOB: TDemoDataJob = {
  action: 'seed',
  matchOutcome: getDemoDataSeedOutcome,
  isSettled: (presence) => presence.hasAll,
}

const DELETE_OUTCOME_BY_TITLE: Record<string, TDemoDataSeedOutcome> = {
  'Demo data removed': 'completed',
  'Demo data removal failed': 'failed',
}

export const createDemoDataDeleteJob = (removing: TDemoDataTypeKey[]): TDemoDataJob => ({
  action: 'delete',
  matchOutcome: ({ objectType, title }) => (objectType === 'delete.completed' ? (DELETE_OUTCOME_BY_TITLE[title ?? ''] ?? null) : null),
  isSettled: ({ counts }) => removing.length > 0 && removing.every((key) => !counts[key]),
})

type TDemoDataJobWatchOptions = {
  job: TDemoDataJob | null
  presence: TDemoDataPresence | undefined
  presenceUpdatedAt: number
  onFinish: (result: TDemoDataJobResult) => void
}

export const useDemoDataJobWatch = ({ job, presence, presenceUpdatedAt, onFinish }: TDemoDataJobWatchOptions) => {
  const { addNewNotificationListener } = useNotificationsContext()
  const onFinishRef = useRef(onFinish)
  const startedAtRef = useRef(0)
  const finishedJobRef = useRef<TDemoDataJob | null>(null)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    if (!job) return
    startedAtRef.current = Date.now()
    finishedJobRef.current = null

    const finish = (result: TDemoDataJobResult) => {
      if (finishedJobRef.current === job) return
      finishedJobRef.current = job
      onFinishRef.current(result)
    }

    const timeout = setTimeout(() => finish('timed-out'), DEMO_DATA_WAIT_MS)
    const unsubscribe = addNewNotificationListener((notification) => {
      const outcome = job.matchOutcome(notification)
      if (outcome) finish(outcome)
    })

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [job, addNewNotificationListener])

  useEffect(() => {
    if (!job || !presence || presenceUpdatedAt <= startedAtRef.current || !job.isSettled(presence) || finishedJobRef.current === job) return
    finishedJobRef.current = job
    onFinishRef.current('completed')
  }, [job, presence, presenceUpdatedAt])
}
