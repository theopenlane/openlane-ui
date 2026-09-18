'use client'

import { useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { describeReportQuery, reconcileReportConfig, type TReportQueryConfig } from '@/lib/report/report-config'
import { addReportHistoryEntry, reportHistoryStore } from '@/lib/report/report-history'
import { useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { formatDateTime } from '@/utils/date'

export type TReportHistoryOption = {
  id: string
  label: string
  runAtLabel: string
  config: TReportQueryConfig
}

export const useReportHistory = (reportableEntityNames: Set<string>) => {
  const { data: sessionData } = useSession()
  const { value: history, setValue: setHistory } = useOrgPersistedState(reportHistoryStore, sessionData?.user?.activeOrganizationId)

  const options = useMemo<TReportHistoryOption[]>(
    () =>
      history.flatMap((entry) => {
        if (!reportableEntityNames.has(entry.entityName)) return []

        const config = reconcileReportConfig(entry)

        return config ? [{ id: entry.id, label: describeReportQuery(config), runAtLabel: formatDateTime(entry.runAt), config }] : []
      }),
    [history, reportableEntityNames],
  )

  const recordRun = useCallback((config: TReportQueryConfig) => setHistory(addReportHistoryEntry(history, config, new Date().toISOString())), [history, setHistory])

  return { options, recordRun }
}
