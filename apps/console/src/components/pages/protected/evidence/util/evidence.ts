import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'

export const EvidenceStatusMapper: Record<EvidenceEvidenceStatus, string> = {
  [EvidenceEvidenceStatus.AUDITOR_APPROVED]: 'Approved by Auditor',
  [EvidenceEvidenceStatus.READY_FOR_AUDITOR]: 'Ready for Auditor',
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: 'Missing Artifact',
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: 'Needs Renewal',
  [EvidenceEvidenceStatus.REJECTED]: 'Rejected',
  [EvidenceEvidenceStatus.SUBMITTED]: 'Submitted',
  [EvidenceEvidenceStatus.IN_REVIEW]: 'In Review',
}
