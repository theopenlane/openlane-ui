'use client'

import { useState, type SetStateAction } from 'react'
import { SOC_2_REQUIRED_CATEGORY } from '@/constants/trust-services-categories'
import { isRecord, isStringArray } from '@/utils/type-guards'
import { clearScanProgress, loadScanProgress, saveScanProgress } from '../../shared/scan-progress-storage'
import { buildSelection, selectAll } from '../selection'
import {
  isReportStepId,
  REPORT_SECTION_IDS,
  type ParsedReport,
  type ReportPlatformFields,
  type ReportPlatformOverrides,
  type ReportProgramChoice,
  type ReportSectionId,
  type ReportSelection,
  type ReportStepId,
  type ReportSystemFields,
  type ReportSystemOverrides,
} from '../types'

type PersistedReportProgress = {
  hasStarted: boolean
  stepId: string
  selection: Partial<Record<ReportSectionId, string[]>>
  platformOverrides: ReportPlatformOverrides
  systemOverrides: ReportSystemOverrides
  program: { create: boolean; categories: string[] }
}

const reportScanProgressStorageKey = (scanId: string) => `report-scan-import:v1:${scanId}`

const patchOverride =
  <T>(id: string, patch: Partial<T>) =>
  (prev: Record<string, Partial<T>>) => ({ ...prev, [id]: { ...prev[id], ...patch } })

const withRequiredCategory = (categories: Iterable<string>) => new Set([SOC_2_REQUIRED_CATEGORY, ...categories])

const readSavedProgress = (storageKey: string): Partial<PersistedReportProgress> | undefined => {
  const saved = loadScanProgress<Partial<PersistedReportProgress>>(storageKey)
  return isRecord(saved) && isRecord(saved.selection) ? saved : undefined
}

export const useReportScanState = (scanId: string, report: ParsedReport, visibleStepIds: ReportStepId[], hasProgramStep: boolean) => {
  const storageKey = reportScanProgressStorageKey(scanId)
  const [saved] = useState(() => readSavedProgress(storageKey))
  const savedProgram = isRecord(saved?.program) ? saved.program : undefined

  const [hasStarted, setHasStarted] = useState(saved?.hasStarted === true)
  const [stepId, setStepId] = useState<ReportStepId>(() => {
    const savedStepId = saved?.stepId
    return savedStepId && isReportStepId(savedStepId) && visibleStepIds.includes(savedStepId) ? savedStepId : visibleStepIds[0]
  })
  const [selection, setSelection] = useState<ReportSelection>(() => {
    const savedSelection = saved?.selection
    return savedSelection ? buildSelection((section) => (isStringArray(savedSelection[section]) ? savedSelection[section] : [])) : selectAll(report)
  })
  const [platformOverrides, setPlatformOverrides] = useState<ReportPlatformOverrides>(() => (isRecord(saved?.platformOverrides) ? saved.platformOverrides : {}))
  const [systemOverrides, setSystemOverrides] = useState<ReportSystemOverrides>(() => (isRecord(saved?.systemOverrides) ? saved.systemOverrides : {}))
  const [program, setProgram] = useState<ReportProgramChoice>(() => ({
    create: hasProgramStep && (typeof savedProgram?.create === 'boolean' ? savedProgram.create : true),
    categories: withRequiredCategory(isStringArray(savedProgram?.categories) ? savedProgram.categories : report.reportedCategories),
  }))

  const setSectionSelection = (section: ReportSectionId) => (update: SetStateAction<Set<string>>) =>
    setSelection((prev) => ({ ...prev, [section]: typeof update === 'function' ? update(prev[section]) : update }))

  const updatePlatform = (id: string, patch: Partial<ReportPlatformFields>) => setPlatformOverrides(patchOverride(id, patch))

  const updateSystem = (id: string, patch: Partial<ReportSystemFields>) => setSystemOverrides(patchOverride(id, patch))

  const persistProgress = () =>
    saveScanProgress<PersistedReportProgress>(storageKey, {
      hasStarted,
      stepId,
      selection: Object.fromEntries(REPORT_SECTION_IDS.map((section) => [section, [...selection[section]]])),
      platformOverrides,
      systemOverrides,
      program: { create: program.create, categories: [...program.categories] },
    })

  const clearProgress = () => clearScanProgress(storageKey)

  return {
    hasStarted,
    setHasStarted,
    stepId,
    setStepId,
    selection,
    setSectionSelection,
    platformOverrides,
    updatePlatform,
    systemOverrides,
    updateSystem,
    program,
    setProgram,
    persistProgress,
    clearProgress,
  }
}

export type ReportScanState = ReturnType<typeof useReportScanState>
