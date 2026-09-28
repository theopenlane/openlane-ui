'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { buildDestinationFields, type TImportFieldMetadata } from './destination-fields'
import { useExampleCSV } from './use-example-csv'
import type { TImportDestination } from './types'

const useImportFieldMetadata = (entityType: ObjectTypes, enabled: boolean) =>
  useQuery({
    queryKey: ['import-field-metadata'],
    queryFn: async () => (await import('@repo/codegen/src/import-fields.generated')).IMPORT_FIELDS,
    staleTime: Infinity,
    select: (all): TImportFieldMetadata => all[entityType] ?? {},
    enabled,
  })

type TImportDestinationState = { destination?: TImportDestination; isLoading: boolean; isError: boolean }

export const useImportDestination = (entityType: ObjectTypes, override?: TImportDestination): TImportDestinationState => {
  const fromBackend = !override
  const example = useExampleCSV(entityType, { enabled: fromBackend })
  const metadata = useImportFieldMetadata(entityType, fromBackend)

  const derived = useMemo(
    () =>
      example.data && !metadata.isPending ? { fieldSet: buildDestinationFields(entityType, example.data, metadata.data), exampleCsv: example.data, exampleFilename: example.filename } : undefined,
    [entityType, example.data, example.filename, metadata.isPending, metadata.data],
  )

  if (override) return { destination: override, isLoading: false, isError: false }

  return { destination: derived, isLoading: example.isLoadingExample || metadata.isPending, isError: example.isError }
}
