import { type CreateEvidenceInput, type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'

import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

import { type CreateEvidenceFormData } from './use-form-schema'

export interface BuildCreateEvidenceInputArgs {
  data: CreateEvidenceFormData
  collectionProcedure?: string | null
  objectAssociations?: TObjectAssociationMap
  programId?: string | null
  status?: EvidenceEvidenceStatus
}

export const toIsoDate = (value: Date | string | null | undefined): string | undefined => {
  if (value === null || value === undefined) return undefined
  return value instanceof Date ? value.toISOString() : value
}

export const buildCreateEvidenceInput = ({ data, collectionProcedure, objectAssociations, programId, status }: BuildCreateEvidenceInputArgs): CreateEvidenceInput => ({
  name: data.name,
  description: data.description,
  tags: data.tags,
  creationDate: toIsoDate(data.creationDate),
  renewalDate: toIsoDate(data.renewalDate),
  collectionProcedure,
  source: data.source,
  fileIDs: data.fileIDs,
  taskIDs: data.taskIDs,
  ...objectAssociations,
  controlIDs: data.controlIDs,
  subcontrolIDs: data.subcontrolIDs,
  programIDs: programId ? [programId] : (data.programIDs ?? []),
  ...(data.url ? { url: data.url } : {}),
  ...(status ? { status } : {}),
  ...(data.reviewFrequency ? { reviewFrequency: data.reviewFrequency } : {}),
})
