import { useMemo } from 'react'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { getReviewHistoryColumns } from '@/components/pages/protected/reviews/common/risk-review-config'

export const useReviewHistoryColumns = (reviews: ReviewsNodeNonNull[]) => {
  const { userMap } = useAuthorMaps(reviews.map((review) => review.reviewerID))

  return useMemo(() => getReviewHistoryColumns(userMap), [userMap])
}
