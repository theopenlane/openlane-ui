'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { buildDestinationFields, type TImportFieldMetadata } from './destination-fields'
import { isEmptyColumn, matchColumns } from './match-columns'
import { toSourceColumns } from './delimited-file'
import { validateMapping } from './validate-mapping'
import { buildImportFile, buildImportPlan } from './build-import-file'
import { useExampleCSV } from './use-example-csv'
import type { TColumnMapping, TDestinationFieldSet, TParsedDelimitedFile } from './types'

export const IMPORT_STEPS = ['upload', 'map', 'review'] as const
export type TImportStep = (typeof IMPORT_STEPS)[number]

export const IMPORT_STEP_LABELS: Record<TImportStep, string> = {
  upload: 'Upload',
  map: 'Map fields',
  review: 'Review',
}

const EMPTY_FIELD_SET: TDestinationFieldSet = { fields: [], requiredGroups: [] }

const useImportFieldMetadata = (entityType: ObjectTypes) =>
  useQuery({
    queryKey: ['import-field-metadata'],
    queryFn: async () => (await import('@repo/codegen/src/import-fields.generated')).IMPORT_FIELDS,
    staleTime: Infinity,
    select: (all): TImportFieldMetadata => all[entityType] ?? {},
  })

export const useRecordImport = ({ entityType, entityLabels }: { entityType: ObjectTypes; entityLabels: string[] }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [parsed, setParsed] = useState<TParsedDelimitedFile | null>(null)
  const [overrides, setOverrides] = useState<Record<number, string | null>>({})

  const { data: exampleCsv, filename: exampleFilename, isLoadingExample, isError: isExampleError } = useExampleCSV(entityType)
  const { data: metadata, isPending: isMetadataPending } = useImportFieldMetadata(entityType)
  const isMetadataSettled = !isMetadataPending

  const fieldSet = useMemo(() => (exampleCsv && isMetadataSettled ? buildDestinationFields(entityType, exampleCsv, metadata) : EMPTY_FIELD_SET), [entityType, exampleCsv, isMetadataSettled, metadata])
  const columns = useMemo(() => (parsed ? toSourceColumns(parsed) : []), [parsed])
  const suggestions = useMemo(() => matchColumns({ entityType, entityLabels, columns, fieldSet }), [entityType, entityLabels, columns, fieldSet])

  const mapping = useMemo(() => {
    const merged: Record<number, TColumnMapping> = {}
    columns.forEach(({ index }) => {
      merged[index] = index in overrides ? { field: overrides[index], confidence: 'manual' } : (suggestions[index] ?? { field: null, confidence: 'none' })
    })

    return merged
  }, [columns, suggestions, overrides])

  const applyFile = useCallback((next: TParsedDelimitedFile | null) => {
    setParsed(next)
    setOverrides({})
  }, [])

  const setColumnField = useCallback(
    (index: number, field: string | null) => {
      const column = columns[index]
      if (!column || isEmptyColumn(column)) return
      setOverrides((current) => ({ ...current, [index]: field }))
    },
    [columns],
  )

  const validation = useMemo(() => validateMapping({ columns, fieldSet, mapping, rows: parsed?.rows ?? [] }), [columns, fieldSet, mapping, parsed])
  const plan = useMemo(() => buildImportPlan({ columns, fields: fieldSet.fields, mapping }), [columns, fieldSet, mapping])

  const toImportFile = useCallback(() => (parsed ? buildImportFile(parsed, plan) : null), [parsed, plan])

  const goToStep = useCallback((step: TImportStep) => setStepIndex(IMPORT_STEPS.indexOf(step)), [])
  const goNext = useCallback(() => setStepIndex((current) => Math.min(current + 1, IMPORT_STEPS.length - 1)), [])
  const goBack = useCallback(() => setStepIndex((current) => Math.max(current - 1, 0)), [])

  return {
    step: IMPORT_STEPS[stepIndex],
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === IMPORT_STEPS.length - 1,
    goToStep,
    goNext,
    goBack,
    parsed,
    applyFile,
    columns,
    fields: fieldSet.fields,
    requiredGroups: fieldSet.requiredGroups,
    mapping,
    setColumnField,
    validation,
    plan,
    toImportFile,
    exampleCsv,
    exampleFilename,
    isLoadingFields: isLoadingExample || !isMetadataSettled,
    isExampleError,
  }
}
