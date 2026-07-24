import { type GetEvidenceQuery } from '@repo/codegen/src/schema'
import { type CreateEvidenceFormInput } from '@/components/pages/protected/evidence/hooks/use-form-schema'

type EvidenceNode = GetEvidenceQuery['evidence']

type EvidenceAssociationIds = {
  controlIDs?: string[]
  subcontrolIDs?: string[]
  programIDs?: string[]
}

export const evidenceToFormValues = (evidence: EvidenceNode | undefined, associations: EvidenceAssociationIds): CreateEvidenceFormInput => ({
  name: evidence?.name ?? '',
  description: evidence?.description ?? '',
  renewalDate: evidence?.renewalDate ? new Date(evidence.renewalDate) : null,
  creationDate: evidence?.creationDate ? new Date(evidence.creationDate) : null,
  status: evidence?.status ?? undefined,
  reviewFrequency: evidence?.reviewFrequency ?? undefined,
  tags: evidence?.tags ?? [],
  collectionProcedure: evidence?.collectionProcedure ?? '',
  source: evidence?.source ?? '',
  url: evidence?.url ?? '',
  externalUUID: evidence?.externalUUID ?? '',
  scopeName: evidence?.scopeName ?? '',
  environmentName: evidence?.environmentName ?? '',
  controlIDs: associations.controlIDs ?? [],
  subcontrolIDs: associations.subcontrolIDs ?? [],
  programIDs: associations.programIDs ?? [],
})
