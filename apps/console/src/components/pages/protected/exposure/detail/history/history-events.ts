import { normalizeResponsibilityField, type ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { EXPOSURE_RESPONSIBILITY_FIELDS, type TExposureResponsibilityKey } from '../responsibility-fields'

type TResponsibilityColumn = TExposureResponsibilityKey | `${TExposureResponsibilityKey}UserID` | `${TExposureResponsibilityKey}GroupID` | `${TExposureResponsibilityKey}IdentityHolderID`

export type TOwnershipHistoryNode = Partial<Record<TResponsibilityColumn, string | null>> & {
  id: string
  historyTime: string
  operation: string
  createdBy?: string | null
  updatedBy?: string | null
}

type TResolveName = (kind: 'user' | 'group' | 'personnel', id: string) => string

export type TOwnershipChange = {
  id: string
  field: string
  from: string | null
  to: string | null
  actorId: string | null
  at: string
}

const responsibilityRef = (node: TOwnershipHistoryNode, key: TExposureResponsibilityKey): ResponsibilitySelection =>
  normalizeResponsibilityField({
    userID: node[`${key}UserID`],
    groupID: node[`${key}GroupID`],
    personnelID: node[`${key}IdentityHolderID`],
    stringValue: node[key]?.trim() || null,
  })

const refKey = (ref: ResponsibilitySelection) => (ref ? `${ref.type}:${ref.value}` : null)

const refLabel = (ref: ResponsibilitySelection, resolveName: TResolveName) => (ref ? (ref.type === 'string' ? ref.value : resolveName(ref.type, ref.value)) : null)

export const historyReferencedIds = (nodes: TOwnershipHistoryNode[]): { userIds: string[]; groupIds: string[]; personnelIds: string[] } => {
  const ids = { user: new Set<string>(), group: new Set<string>(), personnel: new Set<string>() }
  nodes.forEach((node) => {
    if (node.updatedBy) ids.user.add(node.updatedBy)
    if (node.createdBy) ids.user.add(node.createdBy)
    EXPOSURE_RESPONSIBILITY_FIELDS.forEach(({ key }) => {
      const ref = responsibilityRef(node, key)
      if (ref && ref.type !== 'string') ids[ref.type].add(ref.value)
    })
  })
  return { userIds: [...ids.user], groupIds: [...ids.group], personnelIds: [...ids.personnel] }
}

export const buildOwnershipChanges = (nodesNewestFirst: TOwnershipHistoryNode[], updateOperation: string, resolveName: TResolveName): TOwnershipChange[] =>
  nodesNewestFirst.flatMap((node, index) => {
    const previous = nodesNewestFirst[index + 1]
    if (node.operation !== updateOperation || !previous) return []

    return EXPOSURE_RESPONSIBILITY_FIELDS.flatMap(({ key, label }) => {
      const from = responsibilityRef(previous, key)
      const to = responsibilityRef(node, key)
      if (refKey(from) === refKey(to)) return []
      return [{ id: `${node.id}:${key}`, field: label, from: refLabel(from, resolveName), to: refLabel(to, resolveName), actorId: node.updatedBy ?? node.createdBy ?? null, at: node.historyTime }]
    })
  })
