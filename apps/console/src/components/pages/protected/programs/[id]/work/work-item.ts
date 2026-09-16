import { BookText, ClipboardCheck, FileText, Layers, ShieldCheck, type LucideIcon } from 'lucide-react'
import { type AvatarEntityLike } from '@/components/shared/avatar/avatar'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { edgeNodes, firstEdgeNode } from '@/utils/graphql-edges'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type TProgramWorkControlNode, type TProgramWorkEvidenceNode, type TProgramWorkPolicyNode, type TProgramWorkProcedureNode, type TProgramWorkTaskNode } from '@/lib/graphql-hooks/program-work'
import { CONTROL_WORK_STATUS, EVIDENCE_WORK_STATUS, POLICY_WORK_STATUS, PROCEDURE_WORK_STATUS, TASK_WORK_STATUS, WorkStatus } from './work-status'

export enum WorkObjectType {
  TASK = 'TASK',
  CONTROL = 'CONTROL',
  EVIDENCE = 'EVIDENCE',
  POLICY = 'POLICY',
  PROCEDURE = 'PROCEDURE',
}

export const WORK_OBJECT_TYPE_ORDER: readonly WorkObjectType[] = [WorkObjectType.TASK, WorkObjectType.CONTROL, WorkObjectType.EVIDENCE, WorkObjectType.POLICY, WorkObjectType.PROCEDURE]

export const WORK_OBJECT_TYPE_ICON: Record<WorkObjectType, LucideIcon> = {
  [WorkObjectType.TASK]: ClipboardCheck,
  [WorkObjectType.CONTROL]: ShieldCheck,
  [WorkObjectType.EVIDENCE]: Layers,
  [WorkObjectType.POLICY]: FileText,
  [WorkObjectType.PROCEDURE]: BookText,
}

export const WORK_OBJECT_TYPE_ICON_CLASS: Record<WorkObjectType, string> = {
  [WorkObjectType.TASK]: 'text-in-review',
  [WorkObjectType.CONTROL]: 'text-approved',
  [WorkObjectType.EVIDENCE]: 'text-needs-approval',
  [WorkObjectType.POLICY]: 'text-draft',
  [WorkObjectType.PROCEDURE]: 'text-changes-requested',
}

export const WORK_OBJECT_TYPE_PLURAL_LABEL: Record<WorkObjectType, string> = {
  [WorkObjectType.TASK]: 'Tasks',
  [WorkObjectType.CONTROL]: 'Controls',
  [WorkObjectType.EVIDENCE]: 'Evidence',
  [WorkObjectType.POLICY]: 'Policies',
  [WorkObjectType.PROCEDURE]: 'Procedures',
}

export type TWorkOwner = AvatarEntityLike & { id: string; displayName: string }

export type TWorkRelation = {
  label: string
  href: string
}

export type TWorkItem = {
  id: string
  objectType: WorkObjectType
  item: string
  secondary: string | null
  href: string
  workStatus: WorkStatus
  attention: string
  due: string | null
  isOverdue: boolean
  owners: TWorkOwner[]
  relatedTo: TWorkRelation | null
  createdAt: string | null
}

const attentionFor = (sourceStatus: string, workStatus: WorkStatus): string => (sourceStatus === workStatus ? '' : getEnumLabel(sourceStatus))

const controlRelation = (control: { id: string; refCode: string } | null): TWorkRelation | null =>
  control ? { label: control.refCode, href: getHrefForObjectType('controls', { id: control.id }) } : null

const namedRelation = (kind: string, node: { id: string; name: string } | null): TWorkRelation | null => (node ? { label: node.name, href: getHrefForObjectType(kind, { id: node.id }) } : null)

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
    objectType: WorkObjectType.TASK,
    item: node.title,
    secondary: null,
    href: getHrefForObjectType('tasks', { id: node.id }),
    workStatus,
    attention: attentionFor(node.status, workStatus),
    due,
    isOverdue: !!due && workStatus !== WorkStatus.COMPLETED && new Date(due).getTime() < overdueBefore,
    owners: uniqueOwners([node.assignee]),
    relatedTo:
      controlRelation(firstEdgeNode(node.controls)) ??
      namedRelation('policies', firstEdgeNode(node.internalPolicies)) ??
      namedRelation('procedures', firstEdgeNode(node.procedures)) ??
      namedRelation('evidences', firstEdgeNode(node.evidence)),
    createdAt: asIsoString(node.createdAt),
  }
}

export const toControlWorkItem = (node: TProgramWorkControlNode): TWorkItem => {
  const workStatus = node.status ? CONTROL_WORK_STATUS[node.status] : WorkStatus.OPEN

  return {
    id: node.id,
    objectType: WorkObjectType.CONTROL,
    item: node.refCode,
    secondary: node.title || null,
    href: getHrefForObjectType('controls', { id: node.id }),
    workStatus,
    attention: node.status ? attentionFor(node.status, workStatus) : '',
    due: null,
    isOverdue: false,
    owners: uniqueOwners([node.controlOwner]),
    relatedTo: node.referenceFramework ? { label: node.referenceFramework, href: '' } : null,
    createdAt: asIsoString(node.createdAt),
  }
}

export const toEvidenceWorkItem = (node: TProgramWorkEvidenceNode): TWorkItem => {
  const workStatus = node.status ? EVIDENCE_WORK_STATUS[node.status] : WorkStatus.IN_PROGRESS
  const controls = edgeNodes(node.controls)

  return {
    id: node.id,
    objectType: WorkObjectType.EVIDENCE,
    item: node.name,
    secondary: null,
    href: getHrefForObjectType('evidences', { id: node.id }),
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
  objectType: WorkObjectType,
  hrefKind: string,
  statusMap: Record<TStatus, WorkStatus>,
): TWorkItem => {
  const workStatus = sourceStatus ? statusMap[sourceStatus] : WorkStatus.IN_PROGRESS

  return {
    id: node.id,
    objectType,
    item: node.name,
    secondary: null,
    href: getHrefForObjectType(hrefKind, { id: node.id }),
    workStatus,
    attention: sourceStatus ? attentionFor(sourceStatus, workStatus) : '',
    due: null,
    isOverdue: false,
    owners: uniqueOwners([node.approver]),
    relatedTo: controlRelation(firstEdgeNode(node.controls)),
    createdAt: asIsoString(node.createdAt),
  }
}

export const toPolicyWorkItem = (node: TProgramWorkPolicyNode): TWorkItem => toDocumentWorkItem(node, node.status, WorkObjectType.POLICY, 'policies', POLICY_WORK_STATUS)

export const toProcedureWorkItem = (node: TProgramWorkProcedureNode): TWorkItem => toDocumentWorkItem(node, node.status, WorkObjectType.PROCEDURE, 'procedures', PROCEDURE_WORK_STATUS)
