'use client'

import { useMemo } from 'react'
import { skipToken, useQuery } from '@tanstack/react-query'
import { buildRowKeyReader, buildUpdatePreview, collectLookupKeys, toResolvedImport, type TUpdatePreview, type TUpdateRecordSource } from './update-preview'
import type { TImportPlan } from './build-mapped-import'
import type { TDestinationField, TParsedDelimitedFile } from './types'

const PREVIEW_STALE_TIME_MS = 30 * 1000 // 30s

type TUseUpdatePreviewArgs = {
  source?: TUpdateRecordSource
  parsed: TParsedDelimitedFile | null
  plan: TImportPlan
  fields: readonly TDestinationField[]
  lookupField?: TDestinationField
  entityLabel: string
  enabled: boolean
}

type TPreviewStatus = { preview?: TUpdatePreview; isLoading: boolean; isError: boolean }

export type TUpdatePreviewState = TPreviewStatus & {
  blockedReason?: string
  refetch: () => void
  resolved?: { plan: TImportPlan; rows: string[][] }
}

const blockedReasonFor = ({ preview, isLoading, isError }: TPreviewStatus, entityLabel: string): string | undefined => {
  if (isError) return 'The current values could not be loaded'
  if (isLoading || !preview) return 'Matching rows to existing records…'
  if (preview.duplicateRowIndexes.length > 0) return `Remove the rows that repeat a ${entityLabel}`
  if (preview.matched.length === 0) return `No row matches a ${entityLabel} you can access`
  return undefined
}

export const useUpdatePreview = ({ source, parsed, plan, fields, lookupField, entityLabel, enabled }: TUseUpdatePreviewArgs): TUpdatePreviewState | undefined => {
  const rows = parsed?.rows
  const isActive = Boolean(source) && enabled && Boolean(rows?.length)
  const builtRows = useMemo(() => (isActive && rows ? rows.map(plan.buildRow) : []), [isActive, rows, plan])
  const readKeys = useMemo(() => buildRowKeyReader(plan, lookupField), [plan, lookupField])
  const keys = useMemo(() => collectLookupKeys(builtRows, readKeys), [builtRows, readKeys])

  const query = useQuery({
    queryKey: [...(source?.queryKey ?? []), keys],
    queryFn: source && isActive ? () => source.fetchRecords(keys) : skipToken,
    staleTime: PREVIEW_STALE_TIME_MS,
  })

  const preview = useMemo(
    () => (isActive && query.data && !query.isPlaceholderData ? buildUpdatePreview({ builtRows, readKeys, result: query.data, plan, fields, lookupField }) : undefined),
    [isActive, query.data, query.isPlaceholderData, builtRows, readKeys, plan, fields, lookupField],
  )
  const resolved = useMemo(() => (preview ? toResolvedImport(plan, builtRows, preview.matched, lookupField) : undefined), [preview, plan, builtRows, lookupField])

  const isLoading = isActive && (query.isPending || query.isPlaceholderData)
  const { isError, refetch } = query

  return useMemo(() => {
    if (!source) return undefined
    const status = { preview, isLoading, isError }
    return { ...status, blockedReason: blockedReasonFor(status, entityLabel), refetch: () => void refetch(), resolved }
  }, [source, preview, isLoading, isError, entityLabel, refetch, resolved])
}
