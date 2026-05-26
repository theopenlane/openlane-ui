'use client'

import React, { useMemo, useState } from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useScopes } from '@/lib/query-hooks/permissions'
import { toHumanLabel } from '@/utils/strings'

const PERMISSION_ORDER = ['read', 'write', 'delete'] as const

/**
 * Permissions that are automatically granted when the key permission is selected.
 * delete → write + read, write → read
 */
const IMPLIES: Record<string, string[]> = {
  delete: ['write', 'read'],
  write: ['read'],
}

/**
 * Permissions that must be removed when the key permission is deselected.
 * read → write + delete, write → delete
 */
const REQUIRED_BY: Record<string, string[]> = {
  read: ['write', 'delete'],
  write: ['delete'],
}

type ScopesSelectorProps = {
  value: string[]
  onChange: (scopes: string[]) => void
}

export const ScopesSelector = ({ value, onChange }: ScopesSelectorProps) => {
  const { data, isLoading } = useScopes()
  const [filter, setFilter] = useState('')
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(() => new Set())

  const toggleCollapsed = (objectType: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(objectType)) {
        next.delete(objectType)
      } else {
        next.add(objectType)
      }
      return next
    })
  }

  const grouped = useMemo(() => {
    return Object.entries(data?.scopes ?? {}).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  const filteredGrouped = useMemo(() => {
    if (!filter.trim()) return grouped
    const q = filter.toLowerCase()
    return grouped.filter(([objectType]) => objectType.toLowerCase().includes(q) || toHumanLabel(objectType).toLowerCase().includes(q))
  }, [grouped, filter])

  const allScopes = useMemo(() => {
    return grouped.flatMap(([objectType, permissions]) => permissions.map((p) => `${objectType}:${p}`))
  }, [grouped])

  const valueSet = useMemo(() => new Set(value), [value])

  const allCollapsed = filteredGrouped.length > 0 && filteredGrouped.every(([t]) => !expandedTypes.has(t))

  const handleExpandCollapseAll = () => {
    if (allCollapsed) {
      setExpandedTypes((prev) => {
        const next = new Set(prev)
        filteredGrouped.forEach(([t]) => next.add(t))
        return next
      })
    } else {
      setExpandedTypes((prev) => {
        const next = new Set(prev)
        filteredGrouped.forEach(([t]) => next.delete(t))
        return next
      })
    }
  }

  const globalState: boolean | 'indeterminate' = useMemo(() => {
    if (allScopes.length === 0) return false
    const selectedCount = allScopes.filter((s) => valueSet.has(s)).length
    if (selectedCount === 0) return false
    if (selectedCount === allScopes.length) return true
    return 'indeterminate'
  }, [allScopes, valueSet])

  const handleSelectAll = (checked: boolean) => {
    onChange(checked ? allScopes : [])
  }

  const handleTypeToggle = (objectType: string, permissions: string[], checked: boolean) => {
    const typeScopes = permissions.map((p) => `${objectType}:${p}`)
    const filtered = value.filter((s) => !s.startsWith(`${objectType}:`))
    onChange(checked ? [...filtered, ...typeScopes] : filtered)
  }

  const handlePermissionToggle = (objectType: string, permission: string, checked: boolean) => {
    if (checked) {
      // Add the selected permission plus any it implies (e.g. delete implies write + read)
      const toAdd = [permission, ...(IMPLIES[permission] ?? [])].map((p) => `${objectType}:${p}`)
      const next = new Set([...value, ...toAdd])
      onChange([...next])
    } else {
      // Remove the deselected permission plus any that require it (e.g. deselecting read removes write + delete)
      const toRemove = new Set([permission, ...(REQUIRED_BY[permission] ?? [])].map((p) => `${objectType}:${p}`))
      onChange(value.filter((s) => !toRemove.has(s)))
    }
  }

  const getTypeState = (objectType: string, permissions: string[]): boolean | 'indeterminate' => {
    const typeScopes = permissions.map((p) => `${objectType}:${p}`)
    const selected = typeScopes.filter((s) => valueSet.has(s)).length
    if (selected === 0) return false
    if (selected === typeScopes.length) return true
    return 'indeterminate'
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading scopes...</p>
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-muted-foreground">No scopes available</p>
  }

  /** Sort permissions per type in preferred order, extras appended alphabetically */
  const sortPermissions = (permissions: string[]) => {
    const order = PERMISSION_ORDER as readonly string[]
    return [...permissions].sort((a, b) => {
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p className="text-md mb-2">
            Permissions<span className="text-destructive">*</span>
          </p>
          {value.length > 0 && <span className="text-xs text-muted-foreground">({value.length} selected)</span>}
        </div>
        {value.length > 0 && (
          <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => onChange([])}>
            Clear all
          </button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden flex flex-col">
        {/* Global select all + search */}
        <div className="bg-muted/40 border-b space-y-2 px-3 py-2">
          <div className="flex items-start gap-2.5">
            <Checkbox checked={globalState} onCheckedChange={(checked) => handleSelectAll(checked === true)} aria-label="Select all scopes" className="mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select all</span>
              <span className="text-xs text-muted-foreground">Enables every permission scope. We recommend using least-privilege access whenever possible.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter permissions..." value={filter} onChange={(e) => setFilter(e.target.value)} icon={<Search className="h-3.5 w-3.5" />} className="h-7 text-xs flex-1" />
            {filteredGrouped.length > 0 && (
              <button type="button" className="text-xs text-muted-foreground hover:underline shrink-0" onClick={handleExpandCollapseAll}>
                {allCollapsed ? 'Expand all' : 'Collapse all'}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable scope list */}
        <div className="overflow-y-auto divide-y max-h-[calc(90vh-400px)] min-h-20">
          {filteredGrouped.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matching permissions</p>}
          {filteredGrouped.map(([objectType, permissions]) => {
            const typeState = getTypeState(objectType, permissions)
            const sorted = sortPermissions(permissions)
            const isCollapsed = !expandedTypes.has(objectType)
            const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown
            const selectedPermissions = sorted.filter((p) => valueSet.has(`${objectType}:${p}`))

            return (
              <div key={objectType}>
                {/* Object type row */}
                <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30">
                  <Checkbox checked={typeState} onCheckedChange={(checked) => handleTypeToggle(objectType, permissions, checked === true)} aria-label={`Select all ${objectType} scopes`} />
                  <button type="button" className="flex items-center gap-1.5 flex-1 text-left min-w-0" onClick={() => toggleCollapsed(objectType)} aria-expanded={!isCollapsed}>
                    <span className="text-sm font-semibold shrink-0">{toHumanLabel(objectType)}</span>
                    {isCollapsed && selectedPermissions.length > 0 && (
                      <div className="flex items-center gap-1 ml-2 flex-wrap">
                        {selectedPermissions.map((p) => (
                          <span key={p} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                            {toHumanLabel(p)}
                          </span>
                        ))}
                      </div>
                    )}
                    <ChevronIcon className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                  </button>
                </div>

                {/* Permission rows (indented) */}
                {!isCollapsed &&
                  sorted.map((permission) => {
                    const scope = `${objectType}:${permission}`
                    return (
                      <div key={scope} className="flex items-center gap-2.5 pl-8 pr-3 py-1.5 hover:bg-muted/30">
                        <Checkbox checked={valueSet.has(scope)} onCheckedChange={(checked) => handlePermissionToggle(objectType, permission, checked === true)} aria-label={scope} />
                        <span className="text-sm text-muted-foreground">{toHumanLabel(permission)}</span>
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
