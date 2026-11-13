import { getObjectDisplayName, type TObjectNameSource } from '@/utils/object-display-name'
export type TBaseAssociatedNode = TObjectNameSource & {
  id: string
  summary?: string | null
  description?: string | null
  desiredOutcome?: string | null
  details?: string | null
  identityHolderType?: string | null
  __typename?: string
}

export type TEdgeNode<T = TBaseAssociatedNode> = { node?: T | null } | null

export type TConnectionLike = {
  edges?: TEdgeNode[] | null
  totalCount?: number
  [key: string]: unknown
}

export type Section = {
  [key: string]: (TConnectionLike & { hidden?: boolean }) | undefined
}

export type TCenterNode = {
  type: ObjectAssociationNodeEnum
  node: TBaseAssociatedNode
}

export const getObjectName = (node: TBaseAssociatedNode | undefined): string => getObjectDisplayName(node) || 'this object'

export const getCenterNodeObjectName = (centerNode: TCenterNode): string => getObjectName(centerNode?.node)

export enum ObjectAssociationNodeEnum {
  CONTROL = 'controls',
  SUBCONTROL = 'subcontrols',
  CONTROL_OBJECTIVE = 'controlObjectives',
  CONTROL_IMPLEMENTATION = 'controlImplementations',
  POLICY = 'policies',
  PROCEDURE = 'procedures',
  RISKS = 'risks',
  VULNERABILITY = 'vulnerabilities',
  FINDING = 'findings',
  SCAN = 'scans',
  REVIEW = 'reviews',
  REMEDIATION = 'remediations',
  ASSET = 'assets',
  TASK = 'tasks',
  EVIDENCE = 'evidences',
  ENTITY = 'entities',
  IDENTITY_HOLDER = 'identityHolders',
  CONTACT = 'contacts',
}

export type TLinkedProgram = {
  id: string
  name: string
}
