export type TBaseAssociatedNode = {
  id: string
  displayID: string
  name?: string | null
  title?: string | null
  summary?: string | null
  description?: string | null
  details?: string | null
  refCode?: string | null
  __typename?: string
}

export type TEdgeNode = { node?: TBaseAssociatedNode | null } | null

export type TConnectionLike = {
  edges?: TEdgeNode[] | null
  totalCount?: number
  [key: string]: unknown
}

export type Section = { [key: string]: TConnectionLike | undefined }

export type TCenterNode = {
  type: ObjectAssociationNodeEnum
  node: TBaseAssociatedNode
}

export enum ObjectAssociationNodeEnum {
  CONTROL = 'controls',
  SUBCONTROL = 'subcontrols',
  POLICY = 'policies',
  PROCEDURE = 'procedures',
  RISKS = 'risks',
}
