import { useMemo, useState, useCallback, useEffect } from 'react'
import type { MergeConfig, MergeFieldConfig, MergeSource, MergeArrayStrategy } from './types'

export const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

const areEqualValues = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    const sortedA = [...a].map(String).sort()
    const sortedB = [...b].map(String).sort()
    return sortedA.every((v, i) => v === sortedB[i])
  }
  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }
  return false
}

const unionArrays = (primary: unknown, secondary: unknown): string[] => {
  const p = Array.isArray(primary) ? (primary as unknown[]).map(String) : []
  const s = Array.isArray(secondary) ? (secondary as unknown[]).map(String) : []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of [...p, ...s]) {
    if (!seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

const shallowMergeMap = (primary: unknown, secondary: unknown): Record<string, unknown> => {
  const p = (primary && typeof primary === 'object' && !Array.isArray(primary) ? primary : {}) as Record<string, unknown>
  const s = (secondary && typeof secondary === 'object' && !Array.isArray(secondary) ? secondary : {}) as Record<string, unknown>
  return { ...s, ...p }
}

export type FieldResolutionKind = 'hidden' | 'auto-secondary' | 'conflict' | 'merged-array' | 'merged-map'

export type ResolvedField<TRecord> = {
  field: MergeFieldConfig<TRecord>
  kind: FieldResolutionKind
  primaryValue: unknown
  secondaryValue: unknown
  chosenSource: MergeSource
  arrayStrategy?: MergeArrayStrategy
  resolvedValue: unknown
  aliasFoldApplied?: boolean
  aliasFoldEmail?: string | null
}

type Overrides = {
  sources: Record<string, MergeSource>
  arrayStrategies: Record<string, MergeArrayStrategy>
}

export type UseMergeResolutionArgs<TRecord, TUpdateInput> = {
  config: MergeConfig<TRecord, TUpdateInput>
  primary: TRecord | null | undefined
  secondary: TRecord | null | undefined
}

export type UseMergeResolutionResult<TRecord> = {
  resolvedFields: ResolvedField<TRecord>[]
  visibleFields: ResolvedField<TRecord>[]
  resolvedRecord: Partial<TRecord>
  setSource: (fieldKey: string, source: MergeSource) => void
  setArrayStrategy: (fieldKey: string, strategy: MergeArrayStrategy) => void
  emailAliasFold: {
    enabled: boolean
    available: boolean
    emailKey: string | null
    aliasesKey: string | null
    label: string | null
    setEnabled: (next: boolean) => void
  }
}

export const useMergeResolution = <TRecord, TUpdateInput>({ config, primary, secondary }: UseMergeResolutionArgs<TRecord, TUpdateInput>): UseMergeResolutionResult<TRecord> => {
  const [overrides, setOverrides] = useState<Overrides>({ sources: {}, arrayStrategies: {} })
  const [aliasFoldEnabled, setAliasFoldEnabled] = useState<boolean>(config.emailAliasFold?.defaultOn ?? false)

  useEffect(() => {
    setAliasFoldEnabled(config.emailAliasFold?.defaultOn ?? false)
    setOverrides({ sources: {}, arrayStrategies: {} })
  }, [config.emailAliasFold?.defaultOn, primary, secondary])

  const setSource = useCallback((fieldKey: string, source: MergeSource) => {
    setOverrides((prev) => ({ ...prev, sources: { ...prev.sources, [fieldKey]: source } }))
  }, [])

  const setArrayStrategy = useCallback((fieldKey: string, strategy: MergeArrayStrategy) => {
    setOverrides((prev) => ({ ...prev, arrayStrategies: { ...prev.arrayStrategies, [fieldKey]: strategy } }))
  }, [])

  const resolvedFields = useMemo<ResolvedField<TRecord>[]>(() => {
    if (!primary || !secondary) return []

    const base: ResolvedField<TRecord>[] = config.fields.map((field) => {
      const primaryValue = (primary as Record<string, unknown>)[field.key]
      const secondaryValue = (secondary as Record<string, unknown>)[field.key]
      const pEmpty = isEmptyValue(primaryValue)
      const sEmpty = isEmptyValue(secondaryValue)

      if (pEmpty && sEmpty) {
        return {
          field,
          kind: 'hidden' as const,
          primaryValue,
          secondaryValue,
          chosenSource: 'primary' as MergeSource,
          resolvedValue: primaryValue,
        }
      }

      if (!pEmpty && sEmpty) {
        return {
          field,
          kind: 'hidden' as const,
          primaryValue,
          secondaryValue,
          chosenSource: 'primary' as MergeSource,
          resolvedValue: primaryValue,
        }
      }

      if (pEmpty && !sEmpty) {
        const chosenSource = overrides.sources[field.key] ?? 'secondary'
        return {
          field,
          kind: 'auto-secondary' as const,
          primaryValue,
          secondaryValue,
          chosenSource,
          resolvedValue: chosenSource === 'primary' ? primaryValue : secondaryValue,
        }
      }

      if (areEqualValues(primaryValue, secondaryValue)) {
        return {
          field,
          kind: 'hidden' as const,
          primaryValue,
          secondaryValue,
          chosenSource: 'primary' as MergeSource,
          resolvedValue: primaryValue,
        }
      }

      if (field.type === 'tags') {
        const strategy = overrides.arrayStrategies[field.key] ?? 'union'
        const chosenSource = overrides.sources[field.key] ?? 'primary'
        const resolvedValue = strategy === 'union' ? unionArrays(primaryValue, secondaryValue) : chosenSource === 'primary' ? primaryValue : secondaryValue
        return {
          field,
          kind: 'merged-array' as const,
          primaryValue,
          secondaryValue,
          chosenSource,
          arrayStrategy: strategy,
          resolvedValue,
        }
      }

      if (field.type === 'map') {
        return {
          field,
          kind: 'merged-map' as const,
          primaryValue,
          secondaryValue,
          chosenSource: 'primary' as MergeSource,
          resolvedValue: shallowMergeMap(primaryValue, secondaryValue),
        }
      }

      const chosenSource = overrides.sources[field.key] ?? 'primary'
      return {
        field,
        kind: 'conflict' as const,
        primaryValue,
        secondaryValue,
        chosenSource,
        resolvedValue: chosenSource === 'primary' ? primaryValue : secondaryValue,
      }
    })

    const fold = config.emailAliasFold
    if (!fold || !aliasFoldEnabled) return base

    const emailField = base.find((r) => r.field.key === fold.emailKey)
    const aliasesIdx = base.findIndex((r) => r.field.key === fold.aliasesKey)
    if (!emailField || aliasesIdx === -1) return base

    const secondaryEmailRaw = (secondary as Record<string, unknown>)[fold.emailKey]
    const secondaryEmail = typeof secondaryEmailRaw === 'string' && secondaryEmailRaw.trim() !== '' ? secondaryEmailRaw.trim() : null

    const resolvedEmailRaw = emailField.resolvedValue
    const resolvedEmail = typeof resolvedEmailRaw === 'string' ? resolvedEmailRaw.trim() : ''

    const primaryAliases = Array.isArray((primary as Record<string, unknown>)[fold.aliasesKey]) ? ((primary as Record<string, unknown>)[fold.aliasesKey] as unknown[]).map(String) : []
    const secondaryAliases = Array.isArray((secondary as Record<string, unknown>)[fold.aliasesKey]) ? ((secondary as Record<string, unknown>)[fold.aliasesKey] as unknown[]).map(String) : []

    const pool = [...(secondaryEmail ? [secondaryEmail] : []), ...primaryAliases, ...secondaryAliases]
    const out: string[] = []
    const seen = new Set<string>()
    for (const v of pool) {
      if (v === resolvedEmail) continue
      if (!seen.has(v)) {
        seen.add(v)
        out.push(v)
      }
    }

    const existing = base[aliasesIdx]
    const foldedAliases: ResolvedField<TRecord> = {
      ...existing,
      kind: 'merged-array',
      chosenSource: existing.chosenSource,
      arrayStrategy: 'union',
      resolvedValue: out,
      aliasFoldApplied: true,
      aliasFoldEmail: secondaryEmail,
    }

    const next = [...base]
    next[aliasesIdx] = foldedAliases
    return next
  }, [config.fields, config.emailAliasFold, aliasFoldEnabled, primary, secondary, overrides])

  const visibleFields = useMemo(() => resolvedFields.filter((f) => f.kind !== 'hidden'), [resolvedFields])

  const resolvedRecord = useMemo<Partial<TRecord>>(() => {
    const out: Record<string, unknown> = {}
    for (const rf of resolvedFields) {
      if (rf.kind === 'hidden') continue
      out[rf.field.key] = rf.resolvedValue
    }
    return out as Partial<TRecord>
  }, [resolvedFields])

  return {
    resolvedFields,
    visibleFields,
    resolvedRecord,
    setSource,
    setArrayStrategy,
    emailAliasFold: {
      enabled: aliasFoldEnabled,
      available: !!config.emailAliasFold,
      emailKey: config.emailAliasFold?.emailKey ?? null,
      aliasesKey: config.emailAliasFold?.aliasesKey ?? null,
      label: config.emailAliasFold?.label ?? null,
      setEnabled: setAliasFoldEnabled,
    },
  }
}
