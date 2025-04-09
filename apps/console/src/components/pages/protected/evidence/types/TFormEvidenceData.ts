import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

export type TFormEvidenceData = {
  refId: string
  displayID?: string
  tags?: string[]
  objectAssociations: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}
