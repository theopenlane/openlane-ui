import { useCallback, useMemo, useState } from 'react'
import { OBJECT_QUERY_CONFIG, type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { buildMutationKey } from '@/components/shared/object-association/utils'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

export type TAssociationCandidate = {
  objectType: ObjectTypeObjects
  id: string
  label: string
  title?: string | null
}

type TAssociationRef = Pick<TAssociationCandidate, 'objectType' | 'id'>

export type TAssociationChange = TAssociationCandidate & { action: 'add' | 'remove' }

export type TAssociationState = 'none' | 'linked' | 'adding' | 'removing'

export const isSelectedState = (state: TAssociationState): boolean => state === 'linked' || state === 'adding'

export const toAssociationKey = ({ objectType, id }: TAssociationRef) => `${objectType}:${id}`

export const useAssociationChanges = (initialData: TObjectAssociationMap) => {
  const [changes, setChanges] = useState<TAssociationChange[]>([])

  const isLinked = useCallback(({ objectType, id }: TAssociationRef) => (initialData[OBJECT_QUERY_CONFIG[objectType].inputName] ?? []).includes(id), [initialData])

  const activeChanges = useMemo(() => changes.filter((change) => (change.action === 'add') !== isLinked(change)), [changes, isLinked])
  const changesByKey = useMemo(() => new Map(activeChanges.map((change) => [toAssociationKey(change), change])), [activeChanges])

  const getState = (item: TAssociationRef): TAssociationState => {
    const change = changesByKey.get(toAssociationKey(item))
    if (change) return change.action === 'add' ? 'adding' : 'removing'
    return isLinked(item) ? 'linked' : 'none'
  }

  const isSelected = (item: TAssociationRef) => isSelectedState(getState(item))

  const setSelected = (items: readonly TAssociationCandidate[], selected: boolean) => {
    setChanges((previous) => {
      const toActionKey = (change: TAssociationChange) => `${toAssociationKey(change)}:${change.action}`
      const touchedKeys = new Set(items.map(toAssociationKey))
      const wanted = items.filter((item) => isLinked(item) !== selected).map((item): TAssociationChange => ({ ...item, action: selected ? 'add' : 'remove' }))
      const wantedKeys = new Set(wanted.map(toActionKey))
      const pendingKeys = new Set(previous.map(toActionKey))
      const kept = previous.filter((change) => !touchedKeys.has(toAssociationKey(change)) || wantedKeys.has(toActionKey(change)))
      const added = wanted.filter((change) => !pendingKeys.has(toActionKey(change))).reverse()
      return [...added, ...kept]
    })
  }

  const getBulkSelection = (items: readonly TAssociationCandidate[]) => {
    const unlinked = items.filter((item) => !isLinked(item))
    const selectedCount = unlinked.filter(isSelected).length
    const isAllSelected = unlinked.length > 0 && selectedCount === unlinked.length
    return {
      count: unlinked.length,
      isDisabled: unlinked.length === 0,
      isAllSelected,
      checked: isAllSelected || (selectedCount > 0 ? ('indeterminate' as const) : false),
      toggle: () => setSelected(unlinked, !isAllSelected),
    }
  }

  const undo = (change: TAssociationChange) => setChanges((previous) => previous.filter((item) => toAssociationKey(item) !== toAssociationKey(change)))

  const reset = () => setChanges([])

  const getChangeCount = (objectType: ObjectTypeObjects) => activeChanges.filter((change) => change.objectType === objectType).length

  const toInput = () =>
    activeChanges.reduce<Record<string, string[]>>((input, { objectType, id, action }) => {
      const key = buildMutationKey(action, OBJECT_QUERY_CONFIG[objectType].inputName)
      return { ...input, [key]: [...(input[key] ?? []), id] }
    }, {})

  return { changes: activeChanges, getState, isSelected, setSelected, getBulkSelection, undo, reset, getChangeCount, toInput }
}

export type TAssociationChanges = ReturnType<typeof useAssociationChanges>
