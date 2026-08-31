import { EvidenceEvidenceStatus, ReviewReviewStatus } from '@repo/codegen/src/schema'
import { getControlEvidenceStatus, getControlLastReviewed, getControlReview, type ControlReviewSummary } from './control-status'

/**
 * Both roll-ups are priority-ordered, and the ordering is the point: the row must surface the most blocking
 * evidence state and the most active review.
 */

const review = (over: Partial<ControlReviewSummary>): ControlReviewSummary => ({ id: 'r-1', ...over })

describe('getControlEvidenceStatus', () => {
  test('returns null when a control has no evidence', () => {
    expect(getControlEvidenceStatus([])).toBeNull()
  })

  test('returns null when every entry is null or undefined', () => {
    expect(getControlEvidenceStatus([null, undefined])).toBeNull()
  })

  test('surfaces the most blocking status, not the first one present', () => {
    const status = getControlEvidenceStatus([EvidenceEvidenceStatus.AUDITOR_APPROVED, EvidenceEvidenceStatus.REJECTED])

    expect(status).toBe(EvidenceEvidenceStatus.REJECTED)
  })

  test('ranks MISSING_ARTIFACT above every other state', () => {
    const status = getControlEvidenceStatus([EvidenceEvidenceStatus.REJECTED, EvidenceEvidenceStatus.MISSING_ARTIFACT, EvidenceEvidenceStatus.NEEDS_RENEWAL])

    expect(status).toBe(EvidenceEvidenceStatus.MISSING_ARTIFACT)
  })

  test('ranks REJECTED above NEEDS_RENEWAL', () => {
    expect(getControlEvidenceStatus([EvidenceEvidenceStatus.NEEDS_RENEWAL, EvidenceEvidenceStatus.REJECTED])).toBe(EvidenceEvidenceStatus.REJECTED)
  })

  test('only reports AUDITOR_APPROVED when nothing more blocking exists', () => {
    expect(getControlEvidenceStatus([EvidenceEvidenceStatus.AUDITOR_APPROVED])).toBe(EvidenceEvidenceStatus.AUDITOR_APPROVED)
  })

  test('ignores nulls mixed in with real statuses', () => {
    expect(getControlEvidenceStatus([null, EvidenceEvidenceStatus.REQUESTED, undefined])).toBe(EvidenceEvidenceStatus.REQUESTED)
  })
})

describe('getControlReview', () => {
  test('returns null when a control has no reviews', () => {
    expect(getControlReview([])).toBeNull()
  })

  test('prefers an in-progress review over a completed one', () => {
    const picked = getControlReview([review({ id: 'done', status: ReviewReviewStatus.COMPLETED }), review({ id: 'active', status: ReviewReviewStatus.IN_PROGRESS })])

    expect(picked?.id).toBe('active')
  })

  test('prefers IN_PROGRESS over IN_REVIEW over OPEN', () => {
    const reviews = [
      review({ id: 'open', status: ReviewReviewStatus.OPEN }),
      review({ id: 'inreview', status: ReviewReviewStatus.IN_REVIEW }),
      review({ id: 'inprogress', status: ReviewReviewStatus.IN_PROGRESS }),
    ]

    expect(getControlReview(reviews)?.id).toBe('inprogress')
    expect(getControlReview(reviews.slice(0, 2))?.id).toBe('inreview')
  })

  test('ranks WONT_DO last', () => {
    const picked = getControlReview([review({ id: 'wontdo', status: ReviewReviewStatus.WONT_DO }), review({ id: 'done', status: ReviewReviewStatus.COMPLETED })])

    expect(picked?.id).toBe('done')
  })

  test('falls back to the first review when none carry a known status', () => {
    const picked = getControlReview([review({ id: 'first', status: null }), review({ id: 'second' })])

    expect(picked?.id).toBe('first')
  })
})

describe('getControlLastReviewed', () => {
  test('returns null when no review has been reviewed', () => {
    expect(getControlLastReviewed([])).toBeNull()
    expect(getControlLastReviewed([review({ reviewedAt: null })])).toBeNull()
  })

  test('returns the most recent reviewedAt regardless of input order', () => {
    const reviews = [
      review({ id: 'a', reviewedAt: '2026-01-01T00:00:00.000Z' }),
      review({ id: 'b', reviewedAt: '2026-07-01T00:00:00.000Z' }),
      review({ id: 'c', reviewedAt: '2026-03-01T00:00:00.000Z' }),
    ]

    expect(getControlLastReviewed(reviews)).toBe('2026-07-01T00:00:00.000Z')
  })

  test('ignores reviews with no reviewedAt', () => {
    const reviews = [review({ id: 'a', reviewedAt: null }), review({ id: 'b', reviewedAt: '2026-02-01T00:00:00.000Z' })]

    expect(getControlLastReviewed(reviews)).toBe('2026-02-01T00:00:00.000Z')
  })
})
