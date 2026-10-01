import { CREATE_CAPTURED_EVIDENCE } from '@repo/codegen/query/evidence-capture'
import type { CreateCapturedEvidenceMutation, CreateCapturedEvidenceMutationVariables } from '@repo/codegen/src/schema'
import { CAPTURE_PROVENANCE_METADATA_KEY } from '@repo/evidence-capture/provenance'
import { graphqlRequest } from './api'
import type { TCapture } from './capture'
import type { TConnection } from './connection'
import { deriveEvidenceSource } from './evidence-source'

export type TEvidenceDetails = {
  name: string
  description?: string
  controlIDs: string[]
}

export const uploadCapturedEvidence = async (connection: TConnection, { provenance, file }: TCapture, details: TEvidenceDetails) => {
  const { data } = await graphqlRequest<CreateCapturedEvidenceMutation, CreateCapturedEvidenceMutationVariables>(connection, CREATE_CAPTURED_EVIDENCE, {
    input: {
      name: details.name,
      description: details.description || undefined,
      source: deriveEvidenceSource(provenance.source_domain) || undefined,
      url: provenance.source_url,
      creationDate: provenance.captured_at,
      controlIDs: details.controlIDs.length ? details.controlIDs : undefined,
    },
    evidenceFiles: [file],
    evidenceFilesMetadata: [{ name: file.name, metadata: { [CAPTURE_PROVENANCE_METADATA_KEY]: provenance } }],
  })
  return data.createEvidence.evidence
}
