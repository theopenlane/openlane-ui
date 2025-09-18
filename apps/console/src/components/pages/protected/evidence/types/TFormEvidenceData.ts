import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

export type TFormEvidenceData = {
  displayID?: string
  tags?: string[]
  controlRefCodes?: string[]
  suncontrolRefCodes?: string[]
  programDisplayIDs?: string[]
  referenceFramework?: Record<string, string>
  subcontrolReferenceFramework?: Record<string, string>
  objectAssociations: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}
