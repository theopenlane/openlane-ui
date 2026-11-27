import { topNavigationItems } from '@/routes/dashboard'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'

const UNGROUPED_LABEL = 'Other'

const NAV_ANCHOR_BY_TYPE: Record<ObjectTypeObjects, string> = {
  [ObjectTypeObjects.PROGRAM]: 'programs',
  [ObjectTypeObjects.CONTROL]: 'controls',
  [ObjectTypeObjects.SUB_CONTROL]: 'controls',
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: 'controls',
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: 'controls',
  [ObjectTypeObjects.EVIDENCE]: 'evidence',
  [ObjectTypeObjects.INTERNAL_POLICY]: 'policies',
  [ObjectTypeObjects.PROCEDURE]: 'procedures',
  [ObjectTypeObjects.ASSET]: 'assets',
  [ObjectTypeObjects.ENTITY]: 'vendors',
  [ObjectTypeObjects.IDENTITY_HOLDER]: 'personnel',
  [ObjectTypeObjects.RISK]: 'risks',
  [ObjectTypeObjects.ACTION_PLAN]: 'risks',
  [ObjectTypeObjects.SCAN]: 'scans',
  [ObjectTypeObjects.FINDING]: 'findings',
  [ObjectTypeObjects.VULNERABILITY]: 'vulnerabilities',
  [ObjectTypeObjects.REMEDIATION]: 'remediations',
  [ObjectTypeObjects.REVIEW]: 'reviews',
  [ObjectTypeObjects.TASK]: 'tasks',
  [ObjectTypeObjects.CAMPAIGN]: 'campaigns',
  [ObjectTypeObjects.GROUP]: 'groups',
}

const DECLARATION_ORDER = Object.keys(NAV_ANCHOR_BY_TYPE)

export type TAssociationTypeGroup = {
  label: string
  types: ObjectTypeObjects[]
}

const buildNavPositions = () => {
  const positions = new Map<string, { section: string; index: number }>()
  topNavigationItems(null).forEach((item) => {
    if (!('children' in item)) return
    item.children?.forEach(({ anchor }) => {
      if (!positions.has(anchor)) positions.set(anchor, { section: item.title, index: positions.size })
    })
  })
  return positions
}

export const groupAssociationTypes = (types: readonly ObjectTypeObjects[]): TAssociationTypeGroup[] => {
  const positions = buildNavPositions()
  const positionOf = (type: ObjectTypeObjects) => positions.get(NAV_ANCHOR_BY_TYPE[type]) ?? { section: UNGROUPED_LABEL, index: Number.MAX_SAFE_INTEGER }
  const sorted = [...types].sort((a, b) => positionOf(a).index - positionOf(b).index || DECLARATION_ORDER.indexOf(a) - DECLARATION_ORDER.indexOf(b))

  const groups = new Map<string, ObjectTypeObjects[]>()
  sorted.forEach((type) => {
    const { section } = positionOf(type)
    groups.set(section, [...(groups.get(section) ?? []), type])
  })
  return [...groups].map(([label, groupTypes]) => ({ label, types: groupTypes }))
}
