'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GraphQLClient } from 'graphql-request'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import type { TPaginationQuery } from '@repo/ui/pagination-types'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useNotification } from '@/hooks/useNotification'
import { buildReportQuery } from '@/lib/report/build-report-query'
import { exportReport, EXPORT_FORMAT_LABELS, type TReportExportFormat } from '@/lib/report/report-export'
import { flattenRows, type TReportResult } from '@/lib/report/report-rows'
import type { TReportColumn } from '@/lib/report/report-schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ExportTooLargeError, fetchAllConnectionNodes } from './fetch-all-connection-nodes'

export type TReportRequest = {
  runId: number
  entity: TReportEntity
  columns: TReportColumn[]
  where: Record<string, unknown> | null
}

type TReportConnection = {
  totalCount?: number
  pageInfo?: TReportResult['pageInfo']
  edges?: ({ node?: Record<string, unknown> | null } | null)[] | null
}

const fetchConnection = async (client: GraphQLClient, request: TReportRequest, pageQuery: TPaginationQuery): Promise<TReportConnection | undefined> => {
  const { query, variables } = buildReportQuery({ entity: request.entity, columns: request.columns, where: request.where, pageQuery })
  const response = await client.request<Record<string, TReportConnection | null>>(query, variables)

  return response[request.entity.queryName] ?? undefined
}

const exportErrorMessage = (error: unknown): string => (error instanceof ExportTooLargeError ? error.message : parseErrorMessage(error))

export const useReportQuery = (request: TReportRequest | null, pageQuery: TPaginationQuery) => {
  const { client } = useGraphQLClient()

  return useQuery<TReportResult>({
    queryKey: ['custom-report', request?.runId, request?.entity.queryName, request?.columns.map((column) => column.path), request?.where, pageQuery],
    enabled: !!request,
    retry: false,
    queryFn: async () => {
      if (!request) throw new Error('No report configured')

      const connection = await fetchConnection(client, request, pageQuery)
      const nodes = (connection?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

      return {
        totalCount: connection?.totalCount ?? nodes.length,
        pageInfo: connection?.pageInfo ?? {},
        columns: request.columns,
        rows: flattenRows(nodes, request.columns),
      }
    },
  })
}

export const useReportExport = (request: TReportRequest | null) => {
  const { client } = useGraphQLClient()
  const { successNotification, warningNotification, errorNotification, infoNotification } = useNotification()
  const [isExporting, setIsExporting] = useState(false)

  const runExport = useCallback(
    async (format: TReportExportFormat) => {
      if (!request) return

      setIsExporting(true)
      infoNotification({ title: 'Preparing export', description: 'Collecting records. This can take a moment for large reports.' })

      try {
        const nodes = await fetchAllConnectionNodes<Record<string, unknown>>((after) => fetchConnection(client, request, { first: EXPORT_PAGE_SIZE, after }))

        if (nodes.length === 0) {
          warningNotification({ title: 'Nothing to export', description: 'No records match this report.' })
          return
        }

        exportReport(format, flattenRows(nodes, request.columns), request.columns, `${request.entity.queryName}-report`)
        successNotification({ title: 'Export complete', description: `${nodes.length.toLocaleString()} records exported as ${EXPORT_FORMAT_LABELS[format]}.` })
      } catch (error) {
        errorNotification({ title: 'Export failed', description: exportErrorMessage(error) })
      } finally {
        setIsExporting(false)
      }
    },
    [client, errorNotification, infoNotification, request, successNotification, warningNotification],
  )

  return { runExport, isExporting }
}
