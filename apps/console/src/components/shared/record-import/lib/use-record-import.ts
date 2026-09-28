'use client'

import { useCallback, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { isEmptyColumn, matchColumns } from './match-columns'
import { toSourceColumns } from './delimited-file'
import { validateMapping } from './validate-mapping'
import { checkColumnCells, suggestedValueMap, type TColumnCellCheck } from './validate-cells'
import { buildImportPlan, buildMappedImport } from './build-mapped-import'
import { withFixedFields } from './destination-fields'
import { useImportDestination } from './use-import-destination'
import type { TDateOrder } from '@/utils/loose-date'
import type { TColumnMapping, TDestinationField, TDestinationFieldSet, TImportDestination, TParsedDelimitedFile, TValueMap } from './types'

export const IMPORT_STEPS = ['upload', 'map', 'review'] as const
export type TImportStep = (typeof IMPORT_STEPS)[number]

export const IMPORT_STEP_LABELS: Record<TImportStep, string> = {
  upload: 'Upload',
  map: 'Map fields',
  review: 'Review',
}

const EMPTY_FIELD_SET: TDestinationFieldSet = { fields: [], fixedFields: [], requiredGroups: [], uniqueFields: [] }
const NO_FIXED_FIELDS: readonly TDestinationField[] = []

type TUseRecordImportArgs = {
  entityType: ObjectTypes
  entityLabels: string[]
  destination?: TImportDestination
  fixedFields?: readonly TDestinationField[]
}

export const useRecordImport = ({ entityType, entityLabels, destination, fixedFields = NO_FIXED_FIELDS }: TUseRecordImportArgs) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [parsed, setParsed] = useState<TParsedDelimitedFile | null>(null)
  const [overrides, setOverrides] = useState<Record<number, string | null>>({})
  const [valueMaps, setValueMaps] = useState<Record<number, TValueMap>>({})
  const [dateOrders, setDateOrders] = useState<Record<number, TDateOrder>>({})
  const [rowOrder, setRowOrder] = useState<number[] | null>(null)

  const { destination: resolved, isLoading: isLoadingFields, isError: isDestinationError } = useImportDestination(entityType, destination)
  const fieldSet = useMemo(() => (resolved ? withFixedFields(resolved.fieldSet, fixedFields) : EMPTY_FIELD_SET), [resolved, fixedFields])
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
    setRowOrder(null)
  }, [])

  const fileOrder = useMemo(() => (parsed?.rows ?? []).map((_, index) => index), [parsed])
  const orderedRowIndexes = rowOrder ?? fileOrder

  const moveRow = useCallback((from: number, to: number) => setRowOrder((current) => arrayMove(current ?? fileOrder, from, to)), [fileOrder])

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
  const plan = useMemo(() => buildImportPlan({ columns, fields: [...fieldSet.fields, ...fieldSet.fixedFields], mapping }), [columns, fieldSet, mapping])

  const toMappedImport = useCallback(
    () =>
      parsed
        ? buildMappedImport(
            parsed.fileName,
            orderedRowIndexes.map((index) => parsed.rows[index]),
            plan,
          )
        : null,
    [parsed, orderedRowIndexes, plan],
  )

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
    toMappedImport,
    rowOrder: orderedRowIndexes,
    moveRow,
    exampleCsv: resolved?.exampleCsv,
    exampleFilename: resolved?.exampleFilename ?? entityType.toLowerCase(),
    isLoadingFields,
    isDestinationError,
  }
}
