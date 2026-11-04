'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useCanEditObject } from '@/components/shared/crud-base/use-object-permission'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useGetReport } from '@/lib/graphql-hooks/report'
import type { TReportQueryConfig } from '@/lib/report/report-config'
import { resolveSavedReport, SAVED_REPORT_EDIT_MODE, SAVED_REPORT_MODE_PARAM, SAVED_REPORT_PARAM } from '@/lib/report/saved-report'

type TUseSavedReportSessionArgs = {
  reportableEntityNames: ReadonlySet<string>
  applyConfig: (config: TReportQueryConfig, options: { run: boolean }) => void
}

const UNOPENABLE_REPORT_MESSAGE = 'This saved report cannot be opened in the report builder. Its data type may not be available to your organization.'
const UNAVAILABLE_REPORT_MESSAGE = 'This saved report is not available. It may have been deleted, or it has not been shared with you.'

export const useSavedReportSession = ({ reportableEntityNames, applyConfig }: TUseSavedReportSessionArgs) => {
  const { replace } = useSmartRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { warningNotification } = useNotification()

  const reportId = searchParams.get(SAVED_REPORT_PARAM)
  const shouldRun = searchParams.get(SAVED_REPORT_MODE_PARAM) !== SAVED_REPORT_EDIT_MODE
  const { data, isError } = useGetReport(reportId)
  const canManage = useCanEditObject(ObjectTypes.REPORT, reportId, session)
  const appliedIdRef = useRef<string | null>(null)
  const pendingIdRef = useRef<string | null>(null)
  const [unopenableId, setUnopenableId] = useState<string | null>(null)

  const applyReport = useCallback(
    (id: string, variables: unknown, run: boolean) => {
      appliedIdRef.current = id

      const resolved = resolveSavedReport(variables, reportableEntityNames)
      if (!resolved) {
        setUnopenableId(id)
        return
      }

      setUnopenableId(null)
      applyConfig(resolved.config, { run })

      if (resolved.isPartial) {
        warningNotification({ title: 'Report partly restored', description: 'Some columns, filters or the sort order in this report are no longer available, so they were removed.' })
      }
    },
    [applyConfig, reportableEntityNames, warningNotification],
  )

  const report = data?.report ?? null

  useEffect(() => {
    if (pendingIdRef.current && pendingIdRef.current !== reportId) return

    pendingIdRef.current = null

    if (!reportId) {
      appliedIdRef.current = null
      return
    }

    if (!report || appliedIdRef.current === reportId) return

    applyReport(reportId, report.variables, shouldRun)
  }, [applyReport, report, reportId, shouldRun])

  const openReport = useCallback(
    (target: { id: string; variables?: unknown }, { run }: { run: boolean }) => {
      pendingIdRef.current = target.id
      applyReport(target.id, target.variables, run)
      replace({ [SAVED_REPORT_PARAM]: target.id, [SAVED_REPORT_MODE_PARAM]: null })
    },
    [applyReport, replace],
  )

  const attachReport = useCallback(
    (id: string) => {
      pendingIdRef.current = id
      appliedIdRef.current = id
      replace({ [SAVED_REPORT_PARAM]: id, [SAVED_REPORT_MODE_PARAM]: null })
    },
    [replace],
  )

  const detachReport = useCallback(() => {
    pendingIdRef.current = null
    replace({ [SAVED_REPORT_PARAM]: null, [SAVED_REPORT_MODE_PARAM]: null })
  }, [replace])

  const loadError = !reportId ? null : isError && !data ? UNAVAILABLE_REPORT_MESSAGE : unopenableId === reportId ? UNOPENABLE_REPORT_MESSAGE : null

  return { reportId, report: loadError ? null : report, canManage: !!report && !loadError && canManage, loadError, openReport, attachReport, detachReport }
}
