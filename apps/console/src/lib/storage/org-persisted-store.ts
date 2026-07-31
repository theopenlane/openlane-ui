'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { getOrganizationStorageItem, getOrganizationStorageKey, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

export type OrgPersistedSnapshot<T> = {
  value: T
  isHydrated: boolean
}

export type OrgPersistedStore<T> = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: (organizationId?: string) => OrgPersistedSnapshot<T>
  getServerSnapshot: () => OrgPersistedSnapshot<T>
  set: (organizationId: string | undefined, next: T) => void
}

export const createOrgPersistedStore = <T>(storageKey: string, parse: (raw: string) => T | null, createDefault: () => T): OrgPersistedStore<T> => {
  const listeners = new Set<() => void>()
  const snapshots = new Map<string, OrgPersistedSnapshot<T>>()
  const serverSnapshot: OrgPersistedSnapshot<T> = { value: createDefault(), isHydrated: false }

  const scopeOf = (organizationId?: string) => getOrganizationStorageKey(storageKey, organizationId)

  const readSnapshot = (organizationId?: string): OrgPersistedSnapshot<T> => {
    const raw = getOrganizationStorageItem(storageKey, organizationId)
    const parsed = raw === null ? null : parse(raw)
    return { value: parsed === null ? createDefault() : parsed, isHydrated: true }
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: (organizationId) => {
      const scope = scopeOf(organizationId)
      const cached = snapshots.get(scope)
      if (cached) return cached

      const snapshot = readSnapshot(organizationId)
      snapshots.set(scope, snapshot)
      return snapshot
    },
    getServerSnapshot: () => serverSnapshot,
    set: (organizationId, next) => {
      setOrganizationStorageItem(storageKey, JSON.stringify(next), organizationId)

      const scope = scopeOf(organizationId)
      if (snapshots.get(scope)?.value === next) return

      snapshots.set(scope, { value: next, isHydrated: true })
      listeners.forEach((listener) => listener())
    },
  }
}

export const useOrgPersistedState = <T>(store: OrgPersistedStore<T>, organizationId?: string) => {
  const getSnapshot = useCallback(() => store.getSnapshot(organizationId), [store, organizationId])
  const { value, isHydrated } = useSyncExternalStore(store.subscribe, getSnapshot, store.getServerSnapshot)

  const setValue = useCallback((next: T) => store.set(organizationId, next), [store, organizationId])

  return { value, isHydrated, setValue }
}

export const parseStringUnion = <T extends string>(raw: string, isValidValue: (value: string) => value is T): T | null => {
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'string' && isValidValue(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const parseStringArray = (raw: string): string[] | null => {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return null
  }
}

export const parseStringRecord = <T extends string>(raw: string, isValidValue: (value: string) => value is T): Record<string, T> | null => {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

    const entries = Object.entries(parsed).filter((entry): entry is [string, T] => typeof entry[1] === 'string' && isValidValue(entry[1]))
    return Object.fromEntries(entries)
  } catch {
    return null
  }
}
