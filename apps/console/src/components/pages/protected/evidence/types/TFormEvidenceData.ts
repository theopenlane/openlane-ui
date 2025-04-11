import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

export type TFormEvidenceData = {
  displayID?: string
  tags?: string[]
  objectAssociations: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}
