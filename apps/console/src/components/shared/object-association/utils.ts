import { type TBaseAssociatedNode } from '@/components/shared/object-association/types/object-association-types.ts'
import { type TAssociationMutationKey, type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

export const getAssociationDescription = (node: Pick<TBaseAssociatedNode, 'summary' | 'details' | 'description' | 'desiredOutcome'>): string =>
  node.summary || node.details || node.description || node.desiredOutcome || ''

export const getAssociationDisplayName = (node: TBaseAssociatedNode, isPersonnel: boolean): string =>
  isPersonnel ? node.fullName || node.displayName || node.name || node.displayID || '' : node.refCode || node.displayName || node.name || node.title || ''

export const buildMutationKey = <TPrefix extends 'add' | 'remove', TFieldKey extends string>(prefix: TPrefix, key: TFieldKey): TAssociationMutationKey<TPrefix, TFieldKey> => {
  return `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}` as TAssociationMutationKey<TPrefix, TFieldKey>
}

export const getAssociationDiffs = <TFieldKey extends string>(
  initial: TObjectAssociationMap<TFieldKey>,
  current: TObjectAssociationMap<TFieldKey>,
): { added: TObjectAssociationMap<TFieldKey>; removed: TObjectAssociationMap<TFieldKey> } => {
  const added: TObjectAssociationMap<TFieldKey> = {}
  const removed: TObjectAssociationMap<TFieldKey> = {}

  const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

  for (const key of allKeys) {
    const typedKey = key as TFieldKey
    const initialSet = new Set(initial[typedKey] ?? [])
    const currentSet = new Set(current[typedKey] ?? [])

    const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
    const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

    if (addedItems.length > 0) added[typedKey] = addedItems
    if (removedItems.length > 0) removed[typedKey] = removedItems
  }

  return { added, removed }
}

export const getAssociationInput = <TFieldKey extends string>(initialData: TObjectAssociationMap<TFieldKey>, associations: TObjectAssociationMap<TFieldKey>): TAssociationUpdateInput<TFieldKey> => {
  const { added, removed } = getAssociationDiffs(initialData, associations)
  const payload: TAssociationUpdateInput<TFieldKey> = {}

  for (const [key, ids] of Object.entries(added) as [TFieldKey, string[]][]) {
    if (ids.length > 0) {
      payload[buildMutationKey('add', key)] = ids
    }
  }

  for (const [key, ids] of Object.entries(removed) as [TFieldKey, string[]][]) {
    if (ids.length > 0) {
      payload[buildMutationKey('remove', key)] = ids
    }
  }

  return payload
}

export const buildAssociationPayload = <TFieldKey extends string>(
  associationKeys: readonly TFieldKey[],
  formData: Partial<Record<TFieldKey, string[] | undefined>>,
  isCreate: boolean,
  initialAssociations: TObjectAssociationMap<TFieldKey>,
): TObjectAssociationMap<TFieldKey> | TAssociationUpdateInput<TFieldKey> => {
  const associationFields: Partial<Record<TFieldKey, string[] | undefined>> = {}
  for (const key of associationKeys) {
    associationFields[key] = formData[key]
  }

  if (isCreate) {
    const payload: TObjectAssociationMap<TFieldKey> = {}
    const associationEntries = Object.entries(associationFields) as [TFieldKey, string[] | undefined][]
    associationEntries.forEach(([key, ids]) => {
      if (ids?.length) payload[key] = ids
    })
    return payload
  }

  const currentAssociations: TObjectAssociationMap<TFieldKey> = {}
  const associationEntries = Object.entries(associationFields) as [TFieldKey, string[] | undefined][]
  associationEntries.forEach(([key, ids]) => {
    if (ids) currentAssociations[key] = ids
  })
  if (Object.keys(currentAssociations).length > 0) {
    return getAssociationInput(initialAssociations, currentAssociations)
  }
  return {}
}
