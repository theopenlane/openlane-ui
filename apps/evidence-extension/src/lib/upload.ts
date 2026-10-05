import { CREATE_CAPTURED_EVIDENCE } from '@repo/codegen/query/evidence-capture'
import type { CreateCapturedEvidenceMutation, CreateCapturedEvidenceMutationVariables } from '@repo/codegen/src/schema'
import { graphqlRequest } from './api'
import type { TCapture } from './capture'
import type { TConnection } from './connection'
import { deriveEvidenceSource } from './evidence-source'

export type TEvidenceDetails = {
  name: string
  description?: string
  controlIDs: string[]
}

const EVIDENCE_URL_HOST_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+\.?$/i

const evidenceUrl = (sourceUrl: string) => (EVIDENCE_URL_HOST_PATTERN.test(new URL(sourceUrl).host) ? sourceUrl : undefined)

export const uploadCapturedEvidence = async (connection: TConnection, { provenance, file }: TCapture, details: TEvidenceDetails) => {
  const data = await graphqlRequest<CreateCapturedEvidenceMutation, CreateCapturedEvidenceMutationVariables>(connection, CREATE_CAPTURED_EVIDENCE, {
    input: {
      name: details.name,
      description: details.description || undefined,
      source: deriveEvidenceSource(provenance.source_domain) || undefined,
      url: evidenceUrl(provenance.source_url),
      creationDate: provenance.captured_at,
      controlIDs: details.controlIDs.length ? details.controlIDs : undefined,
    },
    evidenceFiles: [file],
    evidenceFilesMetadata: [{ name: file.name, provenance }],
  })
  return data.createEvidence.evidence
}
