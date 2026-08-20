import { ASSOCIATION_SECTION_CONFIG, type AssociationSectionKey, type TAssociationRoot } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { getAssociationDisplayName, getEdgeIds, getEdgeNodes } from '@/components/shared/object-association/utils'

export type TAssociationItem = {
  id: string
  name: string
  kind: AssociationSectionKey
}

const getSectionEdges = (root: TAssociationRoot | undefined, kind: AssociationSectionKey) => root?.[ASSOCIATION_SECTION_CONFIG[kind].dataField]?.edges

export const buildAssociationItems = (sectionKeys: readonly AssociationSectionKey[], root: TAssociationRoot | undefined): TAssociationItem[] =>
  sectionKeys.flatMap((kind) => getEdgeNodes(getSectionEdges(root, kind)).map((node) => ({ id: node.id, name: getAssociationDisplayName(node, kind), kind })))

export const buildAssociationIds = (sectionKeys: readonly AssociationSectionKey[], root: TAssociationRoot | undefined): TObjectAssociationMap =>
  Object.fromEntries(sectionKeys.map((kind) => [ASSOCIATION_SECTION_CONFIG[kind].inputName, getEdgeIds(getSectionEdges(root, kind))]))

export const getAssociationItemKey = (item: TAssociationItem): string => `${item.kind}:${item.id}`

export const isAssociationItemSelected = (associations: TObjectAssociationMap, item: TAssociationItem): boolean =>
  (associations[ASSOCIATION_SECTION_CONFIG[item.kind].inputName] ?? []).includes(item.id)

export const removeAssociationItem = (associations: TObjectAssociationMap, item: TAssociationItem): TObjectAssociationMap => {
  const { inputName } = ASSOCIATION_SECTION_CONFIG[item.kind]

  return { ...associations, [inputName]: (associations[inputName] ?? []).filter((id) => id !== item.id) }
}
