import { type AvatarEntityLike } from '@/components/shared/avatar/avatar'
import { type MapControl } from '@/types'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { edgeNodes, firstEdgeNode } from '@/utils/graphql-edges'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { toHumanLabel } from '@/utils/strings'
import { type TProgramWorkControlNode, type TProgramWorkEvidenceNode, type TProgramWorkPolicyNode, type TProgramWorkProcedureNode, type TProgramWorkTaskNode } from '@/lib/graphql-hooks/program-work'
import { CONTROL_WORK_STATUS, EVIDENCE_WORK_STATUS, POLICY_WORK_STATUS, PROCEDURE_WORK_STATUS, TASK_WORK_STATUS, WorkStatus } from './work-status'

export type TWorkObjectType =
  ObjectAssociationNodeEnum.TASK | ObjectAssociationNodeEnum.CONTROL | ObjectAssociationNodeEnum.EVIDENCE | ObjectAssociationNodeEnum.POLICY | ObjectAssociationNodeEnum.PROCEDURE

export const WORK_OBJECT_TYPE_ORDER: readonly TWorkObjectType[] = [
  ObjectAssociationNodeEnum.TASK,
  ObjectAssociationNodeEnum.CONTROL,
  ObjectAssociationNodeEnum.EVIDENCE,
  ObjectAssociationNodeEnum.POLICY,
  ObjectAssociationNodeEnum.PROCEDURE,
]

export const WORK_OBJECT_TYPE_NAME: Record<TWorkObjectType, ObjectTypes> = {
  [ObjectAssociationNodeEnum.TASK]: ObjectTypes.TASK,
  [ObjectAssociationNodeEnum.CONTROL]: ObjectTypes.CONTROL,
  [ObjectAssociationNodeEnum.EVIDENCE]: ObjectTypes.EVIDENCE,
  [ObjectAssociationNodeEnum.POLICY]: ObjectTypes.INTERNAL_POLICY,
  [ObjectAssociationNodeEnum.PROCEDURE]: ObjectTypes.PROCEDURE,
}

export const workObjectTypeLabel = (objectType: TWorkObjectType): string => toHumanLabel(WORK_OBJECT_TYPE_NAME[objectType])

export const workObjectTypePluralLabel = (objectType: TWorkObjectType): string => ObjectAssociationMap[objectType].label

export const workObjectTypeIcon = (objectType: TWorkObjectType) => ObjectAssociationMap[objectType].icon

export type TWorkOwner = AvatarEntityLike & { id: string; displayName: string }

export type TWorkRelation =
  { kind: 'control'; control: MapControl } | { kind: 'standard'; referenceFramework: string | null } | { kind: 'object'; id: string; objectType: TWorkObjectType; label: string }

export type TWorkItem = {
  id: string
  objectType: TWorkObjectType
  item: string
  secondary: string | null
  workStatus: WorkStatus
  attention: string
  due: string | null
  isOverdue: boolean
  owners: TWorkOwner[]
  relatedTo: TWorkRelation | null
  createdAt: string | null
}

const attentionFor = (sourceStatus: string, workStatus: WorkStatus): string => (sourceStatus === workStatus ? '' : getEnumLabel(sourceStatus))

const controlRelation = (control: { id: string; refCode: string; referenceFramework?: string | null } | null): TWorkRelation | null =>
  control ? { kind: 'control', control: { __typename: ObjectTypes.CONTROL, id: control.id, refCode: control.refCode, referenceFramework: control.referenceFramework ?? null } } : null

const objectRelation = (objectType: TWorkObjectType, node: { id: string; name: string } | null): TWorkRelation | null => (node ? { kind: 'object', id: node.id, objectType, label: node.name } : null)

const asIsoString = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const uniqueOwners = (owners: (TWorkOwner | null | undefined)[]): TWorkOwner[] => {
  const seen = new Map<string, TWorkOwner>()
  owners.forEach((owner) => {
    if (owner && !seen.has(owner.id)) seen.set(owner.id, owner)
  })
  return [...seen.values()]
}

export const toTaskWorkItem = (node: TProgramWorkTaskNode, overdueBefore: number): TWorkItem => {
  const workStatus = TASK_WORK_STATUS[node.status]
  const due = asIsoString(node.due)

  return {
    id: node.id,
    objectType: ObjectAssociationNodeEnum.TASK,
    item: node.title,
    secondary: null,
    workStatus,
    attention: attentionFor(node.status, workStatus),
    due,
    isOverdue: !!due && workStatus !== WorkStatus.COMPLETED && new Date(due).getTime() < overdueBefore,
    owners: uniqueOwners([node.assignee]),
    relatedTo:
      controlRelation(firstEdgeNode(node.controls)) ??
      objectRelation(ObjectAssociationNodeEnum.POLICY, firstEdgeNode(node.internalPolicies)) ??
      objectRelation(ObjectAssociationNodeEnum.PROCEDURE, firstEdgeNode(node.procedures)) ??
      objectRelation(ObjectAssociationNodeEnum.EVIDENCE, firstEdgeNode(node.evidence)),
    createdAt: asIsoString(node.createdAt),
  }
}

export const toControlWorkItem = (node: TProgramWorkControlNode): TWorkItem => {
  const workStatus = node.status ? CONTROL_WORK_STATUS[node.status] : WorkStatus.OPEN

  return {
    id: node.id,
    objectType: ObjectAssociationNodeEnum.CONTROL,
    item: node.refCode,
    secondary: node.title || null,
    workStatus,
    attention: node.status ? attentionFor(node.status, workStatus) : '',
    due: null,
    isOverdue: false,
    owners: uniqueOwners([node.controlOwner]),
    relatedTo: { kind: 'standard', referenceFramework: node.referenceFramework ?? null },
    createdAt: asIsoString(node.createdAt),
  }
}

export const toEvidenceWorkItem = (node: TProgramWorkEvidenceNode): TWorkItem => {
  const workStatus = node.status ? EVIDENCE_WORK_STATUS[node.status] : WorkStatus.IN_PROGRESS
  const controls = edgeNodes(node.controls)

  return {
    id: node.id,
    objectType: ObjectAssociationNodeEnum.EVIDENCE,
    item: node.name,
    secondary: null,
    workStatus,
    attention: node.status ? attentionFor(node.status, workStatus) : '',
    due: null,
    isOverdue: false,
    owners: uniqueOwners(controls.map((control) => control.controlOwner)),
    relatedTo: controlRelation(controls[0] ?? null),
    createdAt: asIsoString(node.createdAt),
  }
}

const toDocumentWorkItem = <TStatus extends string>(
  node: TProgramWorkPolicyNode | TProgramWorkProcedureNode,
  sourceStatus: TStatus | null | undefined,
  objectType: TWorkObjectType,
  statusMap: Record<TStatus, WorkStatus>,
): TWorkItem => {
  const workStatus = sourceStatus ? statusMap[sourceStatus] : WorkStatus.IN_PROGRESS

  return {
    id: node.id,
    objectType,
    item: node.name,
    secondary: null,
    workStatus,
    attention: sourceStatus ? attentionFor(sourceStatus, workStatus) : '',
    due: null,
    isOverdue: false,
    owners: uniqueOwners([node.approver]),
    relatedTo: controlRelation(firstEdgeNode(node.controls)),
    createdAt: asIsoString(node.createdAt),
  }
}

export const toPolicyWorkItem = (node: TProgramWorkPolicyNode): TWorkItem => toDocumentWorkItem(node, node.status, ObjectAssociationNodeEnum.POLICY, POLICY_WORK_STATUS)

export const toProcedureWorkItem = (node: TProgramWorkProcedureNode): TWorkItem => toDocumentWorkItem(node, node.status, ObjectAssociationNodeEnum.PROCEDURE, PROCEDURE_WORK_STATUS)
