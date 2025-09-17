import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

export type TFormEvidenceData = {
  displayID?: string
  tags?: string[]
  controlRefCodes?: string[]
  programDisplayIDs?: string[]
  objectAssociations: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}
