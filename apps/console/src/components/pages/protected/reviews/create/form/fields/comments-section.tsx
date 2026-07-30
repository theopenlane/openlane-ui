'use client'

import React from 'react'
import { type ReviewQuery } from '@repo/codegen/src/schema'
import ReviewCommentList, { hasReviewComments } from '@/components/pages/protected/reviews/common/review-comment-list'

type ReviewCommentsSectionProps = {
  data?: ReviewQuery['review']
  isCreate?: boolean
}

export const ReviewCommentsSection: React.FC<ReviewCommentsSectionProps> = ({ data, isCreate }) => {
  if (isCreate || !hasReviewComments(data?.comments)) {
    return null
  }

  return (
    <div className="mt-6">
      <p className="text-lg font-medium mb-2">Comments</p>
      <ReviewCommentList comments={data?.comments} />
    </div>
  )
}
