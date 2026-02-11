import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

const getAssociationDiffs = (initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } => {
  const added: TObjectAssociationMap = {}
  const removed: TObjectAssociationMap = {}

  const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

  for (const key of allKeys) {
    const initialSet = new Set(initial[key] ?? [])
    const currentSet = new Set(current[key] ?? [])

    const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
    const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

    if (addedItems.length > 0) added[key] = addedItems
    if (removedItems.length > 0) removed[key] = removedItems
  }

  return { added, removed }
}

export const getAssociationInput = (initialData: Partial<Record<string, string[]>>, associations: Partial<Record<string, string[]>>) => {
  const { added, removed } = getAssociationDiffs(initialData, associations)

  return {
    ...Object.entries(added).reduce(
      (acc, [key, ids]) => {
        if (ids && ids.length > 0) acc[buildMutationKey('add', key)] = ids
        return acc
      },
      {} as Record<string, string[]>,
    ),

    ...Object.entries(removed).reduce(
      (acc, [key, ids]) => {
        if (ids && ids.length > 0) acc[buildMutationKey('remove', key)] = ids
        return acc
      },
      {} as Record<string, string[]>,
    ),
  }
}
