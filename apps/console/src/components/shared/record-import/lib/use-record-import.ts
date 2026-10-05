'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { buildDestinationFields, type TImportFieldMetadata } from './destination-fields'
import { isEmptyColumn, matchColumns } from './match-columns'
import { toSourceColumns } from './delimited-file'
import { validateMapping } from './validate-mapping'
import { checkColumnCells, suggestedValueMap, type TColumnCellCheck } from './validate-cells'
import { buildImportFile, buildImportPlan } from './build-import-file'
import { useExampleCSV } from './use-example-csv'
import type { TDateOrder } from '@/utils/loose-date'
import type { TColumnMapping, TDestinationFieldSet, TParsedDelimitedFile, TValueMap } from './types'

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
  const [valueMaps, setValueMaps] = useState<Record<number, TValueMap>>({})
  const [dateOrders, setDateOrders] = useState<Record<number, TDateOrder>>({})

  const { data: exampleCsv, filename: exampleFilename, isLoadingExample, isError: isExampleError } = useExampleCSV(entityType)
  const { data: metadata, isPending: isMetadataPending } = useImportFieldMetadata(entityType)
  const isMetadataSettled = !isMetadataPending

  const fieldSet = useMemo(() => (exampleCsv && isMetadataSettled ? buildDestinationFields(entityType, exampleCsv, metadata) : EMPTY_FIELD_SET), [entityType, exampleCsv, isMetadataSettled, metadata])
  const columns = useMemo(() => (parsed ? toSourceColumns(parsed) : []), [parsed])
  const suggestions = useMemo(() => matchColumns({ entityType, entityLabels, columns, fieldSet }), [entityType, entityLabels, columns, fieldSet])

  const assignments = useMemo(() => {
    const assigned: Record<number, TColumnMapping> = {}
    columns.forEach(({ index }) => {
      assigned[index] = index in overrides ? { field: overrides[index], confidence: 'manual' } : (suggestions[index] ?? { field: null, confidence: 'none' })
    })
    return assigned
  }, [columns, suggestions, overrides])

  const cellChecks = useMemo(() => {
    const fieldByName = new Map(fieldSet.fields.map((field) => [field.name, field]))
    const rows = parsed?.rows ?? []
    const checks = new Map<number, TColumnCellCheck>()
    Object.entries(assignments).forEach(([index, { field }]) => {
      const check = field ? checkColumnCells(rows, Number(index), fieldByName.get(field), dateOrders[Number(index)]) : null
      if (check) checks.set(Number(index), check)
    })
    return checks
  }, [assignments, fieldSet, parsed, dateOrders])

  const mapping = useMemo(() => {
    const merged: Record<number, TColumnMapping> = { ...assignments }
    cellChecks.forEach((check, index) => {
      if (check.mappableValues) merged[index] = { ...assignments[index], valueMap: { ...suggestedValueMap(check), ...valueMaps[index] } }
      if (check.convertedRowCount > 0) merged[index] = { ...merged[index], conversion: { values: check.conversions, rowCount: check.convertedRowCount, dateOrder: check.dateOrder } }
    })
    return merged
  }, [assignments, cellChecks, valueMaps])

  const applyFile = useCallback((next: TParsedDelimitedFile | null) => {
    setParsed(next)
    setOverrides({})
    setValueMaps({})
    setDateOrders({})
  }, [])

  const setColumnField = useCallback(
    (index: number, field: string | null) => {
      const column = columns[index]
      if (!column || isEmptyColumn(column)) return
      if (assignments[index]?.field === field) return
      setOverrides((current) => ({ ...current, [index]: field }))
      setValueMaps(({ [index]: _cleared, ...rest }) => rest)
      setDateOrders(({ [index]: _cleared, ...rest }) => rest)
    },
    [columns, assignments],
  )

  const setColumnDateOrder = useCallback((index: number, order: TDateOrder) => {
    setDateOrders((current) => ({ ...current, [index]: order }))
  }, [])

  const setColumnValue = useCallback((index: number, value: string, target: string | null) => {
    setValueMaps((current) => ({ ...current, [index]: { ...current[index], [value]: target } }))
  }, [])

  const validation = useMemo(() => validateMapping({ columns, fieldSet, mapping, rows: parsed?.rows ?? [], cellChecks }), [columns, fieldSet, mapping, parsed, cellChecks])
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
    setColumnValue,
    setColumnDateOrder,
    validation,
    cellChecks,
    plan,
    toImportFile,
    exampleCsv,
    exampleFilename,
    isLoadingFields: isLoadingExample || !isMetadataSettled,
    isExampleError,
  }
}
