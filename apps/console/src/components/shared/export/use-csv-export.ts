'use client'

import { useCallback, useState } from 'react'
import { exportToCSV, type TExportColumn } from '@/utils/exportToCSV'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TUseCsvExportProps = {
  fileName: string
  entityLabel: string
  entityLabelPlural: string
}

export type TCsvExportPayload<TRow> = {
  rows: TRow[]
  columns: TExportColumn<TRow>[]
}

export const useCsvExport = <TRow extends object>({ fileName, entityLabel, entityLabelPlural }: TUseCsvExportProps) => {
  const { successNotification, warningNotification, errorNotification, infoNotification } = useNotification()
  const [isExporting, setIsExporting] = useState(false)

  const runExport = useCallback(
    async (loadPayload: () => Promise<TCsvExportPayload<TRow>>) => {
      setIsExporting(true)
      infoNotification({ title: 'Preparing export', description: `Collecting ${entityLabelPlural}. This can take a moment for large lists.` })

      try {
        const { rows, columns } = await loadPayload()

        if (rows.length === 0) {
          warningNotification({ title: 'Nothing to export', description: `No ${entityLabelPlural} match the current filters.` })
          return
        }

        exportToCSV(rows, columns, fileName)
        successNotification({ title: 'Export complete', description: `${rows.length} ${rows.length === 1 ? entityLabel : entityLabelPlural} exported.` })
      } catch (error) {
        errorNotification({ title: 'Export failed', description: parseErrorMessage(error) })
      } finally {
        setIsExporting(false)
      }
    },
    [fileName, entityLabel, entityLabelPlural, successNotification, warningNotification, errorNotification, infoNotification],
  )

  return { runExport, isExporting }
}
