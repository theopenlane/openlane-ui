import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectAssociationNodeEnum, type TBaseAssociatedNode } from '@/components/shared/object-association/types/object-association-types.ts'
import { type TAssociationMutationKey, type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export type TAssociationDisplayModel = {
  name: string
  typeLabel: string
  showType: boolean
  detailLabel: string
  detailContent: string
  detailContentIsRichText: boolean
}

type TAssociationDisplayConfig = {
  getName?: (node: TBaseAssociatedNode) => string
  getTypeLabel?: (node: TBaseAssociatedNode) => string
  getDetailLabel?: () => string
  getDetailContent?: (node: TBaseAssociatedNode) => string
  getDetailContentIsRichText?: (node: TBaseAssociatedNode) => boolean
}

export const getAssociationDescription = (node: Pick<TBaseAssociatedNode, 'summary' | 'details' | 'description' | 'desiredOutcome'>): string =>
  node.summary || node.details || node.description || node.desiredOutcome || ''

const DEFAULT_ASSOCIATION_DISPLAY_CONFIG: TAssociationDisplayConfig = {
  getName: (node) => node.refCode || node.displayName || node.name || node.title || '',
  getDetailLabel: () => 'Description',
  getDetailContent: (node) => getAssociationDescription(node) || 'No description available',
  getDetailContentIsRichText: (node) => !!getAssociationDescription(node),
}

const IDENTITY_HOLDER_DISPLAY_CONFIG: TAssociationDisplayConfig = {
  getName: (node) => node.fullName || node.displayName || node.name || node.displayID || '',
  getTypeLabel: (node) => getEnumLabel(node.identityHolderType ?? '') || '—',
  getDetailLabel: () => 'Title',
  getDetailContent: (node) => node.title || 'No title available',
  getDetailContentIsRichText: () => false,
}

const ASSOCIATION_DISPLAY_CONFIG: Record<string, TAssociationDisplayConfig> = {
  [ObjectAssociationNodeEnum.IDENTITY_HOLDER]: IDENTITY_HOLDER_DISPLAY_CONFIG,
  [ObjectTypes.IDENTITY_HOLDER]: IDENTITY_HOLDER_DISPLAY_CONFIG,
}

const getAssociationDisplayConfig = (node: Pick<TBaseAssociatedNode, '__typename'>, associationKind?: string): TAssociationDisplayConfig => {
  if (associationKind && ASSOCIATION_DISPLAY_CONFIG[associationKind]) {
    return ASSOCIATION_DISPLAY_CONFIG[associationKind]
  }

  if (node.__typename && ASSOCIATION_DISPLAY_CONFIG[node.__typename]) {
    return ASSOCIATION_DISPLAY_CONFIG[node.__typename]
  }

  return DEFAULT_ASSOCIATION_DISPLAY_CONFIG
}

export const getAssociationDisplayName = (node: TBaseAssociatedNode, associationKind?: string): string => {
  const config = getAssociationDisplayConfig(node, associationKind)

  return config.getName?.(node) || DEFAULT_ASSOCIATION_DISPLAY_CONFIG.getName?.(node) || ''
}

export const getAssociationDisplayModel = (node: TBaseAssociatedNode, associationKind?: string): TAssociationDisplayModel => {
  const config = getAssociationDisplayConfig(node, associationKind)
  const typeLabel = config.getTypeLabel?.(node) || ''

  return {
    name: getAssociationDisplayName(node, associationKind),
    typeLabel,
    showType: !!typeLabel,
    detailLabel: config.getDetailLabel?.() || DEFAULT_ASSOCIATION_DISPLAY_CONFIG.getDetailLabel?.() || 'Description',
    detailContent: config.getDetailContent?.(node) || DEFAULT_ASSOCIATION_DISPLAY_CONFIG.getDetailContent?.(node) || '',
    detailContentIsRichText: config.getDetailContentIsRichText?.(node) ?? DEFAULT_ASSOCIATION_DISPLAY_CONFIG.getDetailContentIsRichText?.(node) ?? false,
  }
}

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
