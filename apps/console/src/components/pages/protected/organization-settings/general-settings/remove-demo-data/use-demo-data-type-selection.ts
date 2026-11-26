import { useMemo, useState } from 'react'
import { DEMO_DATA_TYPE_GROUPS, DEMO_DATA_TYPES, NOTHING_KEPT, type TDemoDataType, type TDemoDataTypeKey, withRequiredTypes } from '@/constants/demo-data-types'
import { type TDemoDataTypeCounts } from '@/lib/graphql-hooks/demo-data'

const RECOMMENDED_KEYS: ReadonlySet<TDemoDataTypeKey> = new Set(DEMO_DATA_TYPES.filter((type) => type.recommended).map((type) => type.key))

export const useDemoDataTypeSelection = (counts: TDemoDataTypeCounts) => {
  const [selected, setSelected] = useState(RECOMMENDED_KEYS)

  const groups = useMemo(
    () => DEMO_DATA_TYPE_GROUPS.map((group) => ({ ...group, types: group.types.filter((type) => (counts[type.key] ?? 0) > 0) })).filter((group) => group.types.length > 0),
    [counts],
  )
  const kept = useMemo(() => {
    const availableKeys = groups.flatMap((group) => group.types.map((type) => type.key))
    return withRequiredTypes(new Set(availableKeys.filter((key) => selected.has(key))))
  }, [groups, selected])

  const setTypesKept = (types: TDemoDataType[], isKept: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      types.forEach(({ key }) => (isKept ? next.add(key) : next.delete(key)))
      return next
    })

  return {
    groups,
    counts,
    kept,
    keptCount: [...kept].reduce((total, key) => total + (counts[key] ?? 0), 0),
    isKeepingAll: groups.every((group) => group.types.every((type) => kept.has(type.key))),
    setTypesKept,
    clear: () => setSelected(NOTHING_KEPT),
  }
}

export type TDemoDataTypeSelection = ReturnType<typeof useDemoDataTypeSelection>
