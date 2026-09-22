'use client'

import { useCallback, useMemo, useState } from 'react'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { buildDestinationFields } from './destination-fields'
import { matchColumns } from './match-columns'
import { toSourceColumns } from './delimited-file'
import { validateMapping } from './validate-mapping'
import { buildImportFile, buildImportPlan } from './build-import-file'
import { useExampleCSV } from './use-example-csv'
import type { TColumnMapping, TParsedDelimitedFile } from './types'

export const IMPORT_STEPS = ['upload', 'map', 'review'] as const
export type TImportStep = (typeof IMPORT_STEPS)[number]

export const IMPORT_STEP_LABELS: Record<TImportStep, string> = {
  upload: 'Upload',
  map: 'Map fields',
  review: 'Review',
}

export const useRecordImport = (entityType: ObjectTypes, isOpen: boolean) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [parsed, setParsed] = useState<TParsedDelimitedFile | null>(null)
  const [overrides, setOverrides] = useState<Record<number, string | null>>({})

  const { data: exampleCsv, isLoadingExample, isError: isExampleError } = useExampleCSV(entityType, isOpen)

  const fields = useMemo(() => (exampleCsv ? buildDestinationFields(entityType, exampleCsv) : []), [entityType, exampleCsv])
  const requiredFields = useMemo(() => fields.filter((field) => field.required), [fields])
  const columns = useMemo(() => (parsed ? toSourceColumns(parsed) : []), [parsed])
  const suggestions = useMemo(() => matchColumns(entityType, columns, fields), [entityType, columns, fields])

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

  const setColumnField = useCallback((index: number, field: string | null) => {
    setOverrides((current) => ({ ...current, [index]: field }))
  }, [])

  const validation = useMemo(() => validateMapping({ columns, fields, mapping, rowCount: parsed?.rows.length ?? 0 }), [columns, fields, mapping, parsed])
  const plan = useMemo(() => buildImportPlan({ columns, fields, mapping }), [columns, fields, mapping])

  const reset = useCallback(() => {
    setStepIndex(0)
    setParsed(null)
    setOverrides({})
  }, [])

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
    fields,
    requiredFields,
    mapping,
    setColumnField,
    validation,
    plan,
    reset,
    toImportFile,
    isLoadingExample,
    isExampleError,
  }
}
