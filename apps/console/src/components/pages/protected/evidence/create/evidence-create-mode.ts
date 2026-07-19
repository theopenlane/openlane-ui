import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'

export type EvidenceCreateMode = {
  defaultStatus?: EvidenceEvidenceStatus
  showStatusField: boolean
  showCollectionProcedure: boolean
  showFileUpload: boolean
  requireLinkedControls: boolean
  showSaveAsDraft: boolean
  submitLabel: string
}

export const EVIDENCE_CREATE_MODE: EvidenceCreateMode = {
  showStatusField: false,
  showCollectionProcedure: true,
  showFileUpload: true,
  requireLinkedControls: true,
  showSaveAsDraft: true,
  submitLabel: 'Submit for review',
}

export const EVIDENCE_AUDITOR_REQUEST_MODE: EvidenceCreateMode = {
  defaultStatus: EvidenceEvidenceStatus.REQUESTED,
  showStatusField: true,
  showCollectionProcedure: false,
  showFileUpload: false,
  requireLinkedControls: false,
  showSaveAsDraft: false,
  submitLabel: 'Submit Request',
}
