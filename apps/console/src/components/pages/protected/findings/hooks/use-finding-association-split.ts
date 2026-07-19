import { useCallback } from 'react'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { splitJoinTableInput } from '@/components/shared/object-association/join-table-links'
import { FINDING_CONTROL_JOIN_KEY_ON_FINDING } from '@/components/shared/object-association/finding-control-links'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

const ASSOCIATION_KEYS = FINDING_ASSOCIATION_CONFIG.associationKeys
const ASSOCIATION_KEY_SET = new Set<string>(ASSOCIATION_KEYS)

export const omitAssociationKeys = <TFormData extends object>(formData: TFormData): Omit<TFormData, (typeof ASSOCIATION_KEYS)[number]> =>
  Object.fromEntries(Object.entries(formData).filter(([key]) => !ASSOCIATION_KEY_SET.has(key))) as Omit<TFormData, (typeof ASSOCIATION_KEYS)[number]>

const pickAssociations = (formData: Record<string, unknown>): TObjectAssociationMap => Object.fromEntries(ASSOCIATION_KEYS.map((key) => [key, (formData[key] as string[] | undefined) ?? []]))

export const useFindingAssociationSplit = ({ isCreate, initialAssociationsRef }: { isCreate: boolean; initialAssociationsRef: { current: TObjectAssociationMap } }) => {
  const splitAssociations = useCallback(
    (formData: Record<string, unknown>) => {
      const associationPayload = buildAssociationPayload(
        ASSOCIATION_KEYS,
        Object.fromEntries(ASSOCIATION_KEYS.map((key) => [key, formData[key] as string[] | undefined])),
        isCreate,
        initialAssociationsRef.current,
      )
      return splitJoinTableInput(associationPayload, FINDING_CONTROL_JOIN_KEY_ON_FINDING)
    },
    [isCreate, initialAssociationsRef],
  )

  const commitBaseline = useCallback((formData: Record<string, unknown>) => (initialAssociationsRef.current = pickAssociations(formData)), [initialAssociationsRef])

  return { splitAssociations, commitBaseline }
}
