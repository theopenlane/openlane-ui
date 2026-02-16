import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

export type TFormEvidenceData = {
  displayID?: string
  controlID?: string
  subcontrolID?: string
  tags?: string[]
  controlRefCodes?: string[]
  subcontrolRefCodes?: string[]
  programDisplayIDs?: string[]
  referenceFramework?: Record<string, string>
  subcontrolReferenceFramework?: Record<string, string>
  objectAssociations: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}
