import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'

const ASSOCIATION_DISPLAY_NAMES: Partial<Record<ObjectTypeObjects, string>> = {
  [ObjectTypeObjects.CONTROL]: 'Associate Controls',
  [ObjectTypeObjects.PROGRAM]: 'Associate Programs',
  [ObjectTypeObjects.INTERNAL_POLICY]: 'Associate Policies',
  [ObjectTypeObjects.PROCEDURE]: 'Associate Procedures',
  [ObjectTypeObjects.RISK]: 'Associate Risks',
  [ObjectTypeObjects.SUB_CONTROL]: 'Associate Subcontrols',
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: 'Associate Control Implementations',
  [ObjectTypeObjects.SCAN]: 'Associate Scans',
  [ObjectTypeObjects.ASSET]: 'Associate Assets',
}

export const getAssociationActionLabel = (objectType: ObjectTypeObjects): string => ASSOCIATION_DISPLAY_NAMES[objectType] ?? objectType
