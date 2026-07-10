export type TBaseAssociatedNode = {
  id: string
  displayID?: string | null
  displayName?: string | null
  name?: string | null
  fullName?: string | null
  title?: string | null
  summary?: string | null
  description?: string | null
  desiredOutcome?: string | null
  details?: string | null
  refCode?: string | null
  identityHolderType?: string | null
  __typename?: string
}

export type TEdgeNode = { node?: TBaseAssociatedNode | null } | null

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

export const getObjectName = (node: TBaseAssociatedNode | undefined): string => node?.refCode ?? node?.fullName ?? node?.displayName ?? node?.name ?? node?.title ?? 'this object'

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
  ENTITY = 'entities',
  IDENTITY_HOLDER = 'identityHolders',
}
