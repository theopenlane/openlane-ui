import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { buildAssociationPayload, getAssociationInput } from '@/components/shared/object-association/utils'
import { splitJoinTableInput, type TJoinLinkDiff } from '@/components/shared/object-association/join-table-links'
import { FINDING_CONTROL_JOIN_KEY_ON_FINDING } from '@/components/shared/object-association/finding-control-links'
import { type FindingFormData } from './use-form-schema'

type TFindingAssociationKey = (typeof FINDING_ASSOCIATION_CONFIG.associationKeys)[number]

const ASSOCIATION_KEY_SET = new Set<string>(FINDING_ASSOCIATION_CONFIG.associationKeys)

const ENTITY_ASSOCIATION_KEYS = FINDING_ASSOCIATION_CONFIG.associationKeys.filter((key) => key !== FINDING_CONTROL_JOIN_KEY_ON_FINDING)

export const omitAssociationKeys = <TFormData extends object>(formData: TFormData): Omit<TFormData, TFindingAssociationKey> =>
  Object.fromEntries(Object.entries(formData).filter(([key]) => !ASSOCIATION_KEY_SET.has(key))) as Omit<TFormData, TFindingAssociationKey>

export const buildFindingCreateAssociations = (formData: FindingFormData) => buildAssociationPayload(ENTITY_ASSOCIATION_KEYS, formData, true, {})

export const getFindingControlLinks = (linkedControlIDs: string[], controlIDs: string[]): TJoinLinkDiff =>
  splitJoinTableInput(getAssociationInput({ [FINDING_CONTROL_JOIN_KEY_ON_FINDING]: linkedControlIDs }, { [FINDING_CONTROL_JOIN_KEY_ON_FINDING]: controlIDs }), FINDING_CONTROL_JOIN_KEY_ON_FINDING)
    .links
