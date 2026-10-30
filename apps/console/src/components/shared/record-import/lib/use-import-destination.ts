'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { buildDestinationFields, buildUpdateDestination, type TImportFieldMetadata } from './destination-fields'
import { useExampleCSV } from './use-example-csv'
import type { TImportDestination, TImportMode } from './types'

const METADATA_LOADERS: Record<TImportMode, () => Promise<Readonly<Record<string, TImportFieldMetadata>>>> = {
  create: async () => (await import('@repo/codegen/src/import-fields.generated')).IMPORT_FIELDS,
  update: async () => (await import('@repo/codegen/src/import-update-fields.generated')).IMPORT_UPDATE_FIELDS,
}

const useFieldMetadata = (mode: TImportMode, entityType: ObjectTypes, enabled: boolean) =>
  useQuery({
    queryKey: ['import-field-metadata', mode],
    queryFn: METADATA_LOADERS[mode],
    staleTime: Infinity,
    select: (all): TImportFieldMetadata => all[entityType] ?? {},
    enabled,
  })

type TImportDestinationState = { destination?: TImportDestination; isLoading: boolean; isError: boolean }

export const useImportDestination = (entityType: ObjectTypes, mode: TImportMode, override?: TImportDestination): TImportDestinationState => {
  const fromBackend = !override
  const isUpdate = mode === 'update'
  const example = useExampleCSV(entityType, { enabled: fromBackend })
  const createMetadata = useFieldMetadata('create', entityType, fromBackend)
  const updateMetadata = useFieldMetadata('update', entityType, fromBackend && isUpdate)
  const isMetadataPending = createMetadata.isPending || (isUpdate && updateMetadata.isPending)
  const isMetadataError = isUpdate && (createMetadata.isError || updateMetadata.isError)

  const derived = useMemo((): TImportDestination | undefined => {
    if (!example.data || isMetadataPending) return undefined
    if (!isUpdate) return { fieldSet: buildDestinationFields(entityType, example.data, createMetadata.data), exampleCsv: example.data, exampleFilename: example.filename }
    if (!createMetadata.data || !updateMetadata.data) return undefined

    return buildUpdateDestination({ entityType, sampleCsv: example.data, sampleFilename: example.filename, createMetadata: createMetadata.data, updateMetadata: updateMetadata.data })
  }, [entityType, isUpdate, example.data, example.filename, isMetadataPending, createMetadata.data, updateMetadata.data])

  if (override) return { destination: override, isLoading: false, isError: false }

  return { destination: derived, isLoading: example.isLoadingExample || isMetadataPending, isError: example.isError || isMetadataError }
}
