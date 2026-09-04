import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { type TLinkedProgram } from '@/components/shared/object-association/types/object-association-types.ts'

export type TFormEvidenceData = {
  displayID?: string
  controlID?: string
  subcontrolID?: string
  tags?: string[]
  controlRefCodes?: string[]
  subcontrolRefCodes?: string[]
  linkedPrograms?: TLinkedProgram[]
  referenceFramework?: Record<string, string>
  subcontrolReferenceFramework?: Record<string, string>
  objectAssociations: TObjectAssociationMap
}
