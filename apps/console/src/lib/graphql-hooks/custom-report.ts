'use client'

import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { GraphQLClient } from 'graphql-request'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import type { TPaginationQuery } from '@repo/ui/pagination-types'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useNotification } from '@/hooks/useNotification'
import { buildReportQuery } from '@/lib/report/build-report-query'
import { exportReport, EXPORT_FORMAT_LABELS, type TReportExportFormat } from '@/lib/report/report-export'
import { flattenRows, type TReportResult, type TReportRow } from '@/lib/report/report-rows'
import type { TReportColumn, TReportOrder } from '@/lib/report/report-schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ExportTooLargeError, fetchAllConnectionNodes } from './fetch-all-connection-nodes'

export type TReportRequest = {
  runId: number
  entity: TReportEntity
  columns: TReportColumn[]
  where: Record<string, unknown> | null
  orderBy: TReportOrder | null
  limit: number | null
}

type TReportConnection = {
  totalCount?: number
  pageInfo?: TReportResult['pageInfo']
  edges?: ({ node?: Record<string, unknown> | null } | null)[] | null
}

const fetchConnection = async (client: GraphQLClient, request: TReportRequest, pageQuery: TPaginationQuery): Promise<TReportConnection | undefined> => {
  const { query, variables } = buildReportQuery({ entity: request.entity, columns: request.columns, where: request.where, orderBy: request.orderBy, pageQuery })
  const response = await client.request<Record<string, TReportConnection | null>>(query, variables)

  return response[request.entity.queryName] ?? undefined
}

const fetchWindow = async (client: GraphQLClient, request: TReportRequest, limit: number | null) => {
  let matchedCount = 0

  const nodes = await fetchAllConnectionNodes<Record<string, unknown>>(async (after, remaining) => {
    const connection = await fetchConnection(client, request, { first: Math.min(EXPORT_PAGE_SIZE, remaining), after })
    matchedCount = connection?.totalCount ?? matchedCount

    return connection
  }, limit)

  return { nodes, matchedCount }
}

const reportQueryKey = (request: TReportRequest | null, pageQuery: TPaginationQuery | null) => [
  'custom-report',
  request?.runId,
  request?.entity.queryName,
  request?.columns.map((column) => column.path),
  request?.where,
  request?.orderBy,
  request?.limit ?? null,
  pageQuery,
]

const exportErrorMessage = (error: unknown): string => (error instanceof ExportTooLargeError ? error.message : parseErrorMessage(error))

export const useReportQuery = (request: TReportRequest | null, pageQuery: TPaginationQuery) => {
  const { client } = useGraphQLClient()
  const limit = request?.limit ?? null

  return useQuery<TReportResult>({
    queryKey: reportQueryKey(request, limit ? null : pageQuery),
    enabled: !!request,
    retry: false,
    queryFn: async () => {
      if (!request) throw new Error('No report configured')

      if (request.limit) {
        const { nodes, matchedCount } = await fetchWindow(client, request, request.limit)

        return {
          totalCount: nodes.length,
          matchedCount: Math.max(matchedCount, nodes.length),
          columns: request.columns,
          rows: flattenRows(nodes, request.columns),
        }
      }

      const connection = await fetchConnection(client, request, pageQuery)
      const nodes = (connection?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
      const totalCount = connection?.totalCount ?? nodes.length

      return {
        totalCount,
        matchedCount: totalCount,
        pageInfo: connection?.pageInfo ?? {},
        columns: request.columns,
        rows: flattenRows(nodes, request.columns),
      }
    },
  })
}

export const useReportExport = (request: TReportRequest | null) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  const { successNotification, warningNotification, errorNotification, infoNotification } = useNotification()
  const [isExporting, setIsExporting] = useState(false)

  const collectRows = useCallback(
    async (exportRequest: TReportRequest): Promise<TReportRow[]> => {
      const windowed = queryClient.getQueryData<TReportResult>(reportQueryKey(exportRequest, null))
      if (windowed && !windowed.pageInfo) return windowed.rows

      const { nodes } = await fetchWindow(client, exportRequest, exportRequest.limit)

      return flattenRows(nodes, exportRequest.columns)
    },
    [client, queryClient],
  )

  const runExport = useCallback(
    async (format: TReportExportFormat) => {
      if (!request) return

      setIsExporting(true)
      infoNotification({ title: 'Preparing export', description: 'Collecting records. This can take a moment for large reports.' })

      try {
        const rows = await collectRows(request)

        if (rows.length === 0) {
          warningNotification({ title: 'Nothing to export', description: 'No records match this report.' })
          return
        }

        exportReport(format, rows, request.columns, `${request.entity.queryName}-report`)
        successNotification({ title: 'Export complete', description: `${rows.length.toLocaleString()} records exported as ${EXPORT_FORMAT_LABELS[format]}.` })
      } catch (error) {
        errorNotification({ title: 'Export failed', description: exportErrorMessage(error) })
      } finally {
        setIsExporting(false)
      }
    },
    [collectRows, errorNotification, infoNotification, request, successNotification, warningNotification],
  )

  return { runExport, isExporting }
}
