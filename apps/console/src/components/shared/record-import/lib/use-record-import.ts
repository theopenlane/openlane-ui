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
import type { TColumnMapping, TDestinationField, TDestinationFieldSet, TImportDestination, TParsedDelimitedFile, TValueMap } from './types'

export type TImportStepDescriptor<TId extends string = string> = { id: TId; label: string }

export const UPLOAD_STEP = { id: 'upload', label: 'Upload' } as const
export const MAP_STEP = { id: 'map', label: 'Map fields' } as const
export const REVIEW_STEP = { id: 'review', label: 'Review' } as const

export const IMPORT_STEPS = [UPLOAD_STEP, MAP_STEP, REVIEW_STEP] as const

const EMPTY_FIELD_SET: TDestinationFieldSet = { fields: [], fixedFields: [], requiredGroups: [], uniqueFields: [] }
const NO_FIXED_FIELDS: readonly TDestinationField[] = []

type TUseRecordImportArgs<TStepId extends string> = {
  entityType: ObjectTypes
  entityLabels: string[]
  steps: readonly TImportStepDescriptor<TStepId>[]
  destination?: TImportDestination
  fixedFields?: readonly TDestinationField[]
}

export const useRecordImport = <TStepId extends string>({ entityType, entityLabels, steps, destination, fixedFields = NO_FIXED_FIELDS }: TUseRecordImportArgs<TStepId>) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [parsed, setParsed] = useState<TParsedDelimitedFile | null>(null)
  const [overrides, setOverrides] = useState<Record<number, string | null>>({})
  const [valueMaps, setValueMaps] = useState<Record<number, TValueMap>>({})
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
      const check = field ? checkColumnCells(rows, Number(index), fieldByName.get(field)) : null
      if (check) checks.set(Number(index), check)
    })
    return checks
  }, [assignments, fieldSet, parsed])

  const mapping = useMemo(() => {
    const merged: Record<number, TColumnMapping> = { ...assignments }
    cellChecks.forEach((check, index) => {
      if (check.mappableValues) merged[index] = { ...assignments[index], valueMap: { ...suggestedValueMap(check), ...valueMaps[index] } }
    })
    return merged
  }, [assignments, cellChecks, valueMaps])

  const applyFile = useCallback((next: TParsedDelimitedFile | null) => {
    setParsed(next)
    setOverrides({})
    setValueMaps({})
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
    },
    [columns, assignments],
  )

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

  const goToStep = useCallback(
    (id: TStepId) => {
      const index = steps.findIndex((step) => step.id === id)
      if (index >= 0) setStepIndex(index)
    },
    [steps],
  )
  const goNext = useCallback(() => setStepIndex((current) => Math.min(current + 1, steps.length - 1)), [steps])
  const goBack = useCallback(() => setStepIndex((current) => Math.max(current - 1, 0)), [])

  return {
    steps,
    step: steps[stepIndex].id,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === steps.length - 1,
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

export type TRecordImportState<TStepId extends string = string> = ReturnType<typeof useRecordImport<TStepId>>

export type TImportFlowState = Pick<TRecordImportState, 'steps' | 'step' | 'parsed' | 'isFirstStep' | 'isLastStep' | 'goNext' | 'goBack'>

export type TImportSourceState = Pick<
  TRecordImportState,
  | 'step'
  | 'parsed'
  | 'applyFile'
  | 'requiredGroups'
  | 'isLoadingFields'
  | 'fields'
  | 'exampleCsv'
  | 'exampleFilename'
  | 'columns'
  | 'mapping'
  | 'validation'
  | 'cellChecks'
  | 'setColumnField'
  | 'setColumnValue'
>
