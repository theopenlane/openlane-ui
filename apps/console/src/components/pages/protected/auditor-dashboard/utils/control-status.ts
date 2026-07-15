import { EvidenceEvidenceStatus, ReviewReviewStatus } from '@repo/codegen/src/schema'

const EVIDENCE_BLOCKING_PRIORITY: EvidenceEvidenceStatus[] = [
  EvidenceEvidenceStatus.MISSING_ARTIFACT,
  EvidenceEvidenceStatus.REJECTED,
  EvidenceEvidenceStatus.NEEDS_RENEWAL,
  EvidenceEvidenceStatus.REQUESTED,
  EvidenceEvidenceStatus.DRAFT,
  EvidenceEvidenceStatus.SUBMITTED,
  EvidenceEvidenceStatus.IN_REVIEW,
  EvidenceEvidenceStatus.READY_FOR_AUDITOR,
  EvidenceEvidenceStatus.AUDITOR_APPROVED,
]

const REVIEW_ACTIVITY_PRIORITY: ReviewReviewStatus[] = [ReviewReviewStatus.IN_PROGRESS, ReviewReviewStatus.IN_REVIEW, ReviewReviewStatus.OPEN, ReviewReviewStatus.COMPLETED, ReviewReviewStatus.WONT_DO]

export type ControlReviewSummary = {
  id: string
  status?: ReviewReviewStatus | null
  reviewedAt?: string | null
}

export const getControlEvidenceStatus = (statuses: (EvidenceEvidenceStatus | null | undefined)[]): EvidenceEvidenceStatus | null => {
  const present = statuses.filter((status): status is EvidenceEvidenceStatus => !!status)
  if (present.length === 0) {
    return null
  }
  const blocking = EVIDENCE_BLOCKING_PRIORITY.find((status) => present.includes(status))
  return blocking ?? present[0]
}

export const getControlReview = (reviews: ControlReviewSummary[]): ControlReviewSummary | null => {
  if (reviews.length === 0) {
    return null
  }
  for (const status of REVIEW_ACTIVITY_PRIORITY) {
    const match = reviews.find((review) => review.status === status)
    if (match) {
      return match
    }
  }
  return reviews[0]
}

export const getControlLastReviewed = (reviews: ControlReviewSummary[]): string | null => {
  const dates = reviews.map((review) => review.reviewedAt).filter((date): date is string => !!date)
  if (dates.length === 0) {
    return null
  }
  return dates.reduce((latest, date) => (date > latest ? date : latest))
}
