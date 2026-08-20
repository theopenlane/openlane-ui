'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const DISMISSED_EVENT = 'suggestion-item-dismissed'

const normalize = (item: string) => item.trim().toLowerCase()

export function readDismissedItems(scope?: string, organizationId?: string): string[] {
  if (!scope) return []
  try {
    const stored = getOrganizationStorageItem(scope, organizationId)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

export function dismissItem(scope: string, item: string, organizationId?: string) {
  const next = [...new Set([...readDismissedItems(scope, organizationId), normalize(item)])]
  setOrganizationStorageItem(scope, JSON.stringify(next), organizationId)
  window.dispatchEvent(new CustomEvent(DISMISSED_EVENT))
}

// dismissed items stay dismissed: stored per scope, scoped to the organization,
// and broadcast so every surface reading the same scope stays in step
export function useDismissedItems(scope?: string) {
  const { currentOrgId } = useOrganization()
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissedItems(scope, currentOrgId))

  useEffect(() => {
    const sync = () =>
      setDismissed((current) => {
        const next = readDismissedItems(scope, currentOrgId)
        return next.length === current.length && next.every((item, index) => item === current[index]) ? current : next
      })
    sync()
    window.addEventListener(DISMISSED_EVENT, sync)
    return () => window.removeEventListener(DISMISSED_EVENT, sync)
  }, [scope, currentOrgId])

  const dismissedSet = useMemo(() => new Set(dismissed), [dismissed])

  const dismiss = useCallback(
    (item: string) => {
      if (scope) dismissItem(scope, item, currentOrgId)
    },
    [scope, currentOrgId],
  )

  const isDismissed = useCallback((item: string) => dismissedSet.has(normalize(item)), [dismissedSet])

  return { dismissed, isDismissed, dismiss }
}
