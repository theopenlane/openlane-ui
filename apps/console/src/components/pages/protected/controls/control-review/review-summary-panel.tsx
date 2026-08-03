'use client'

import React from 'react'
import { Panel } from '@repo/ui/panel'
import { type ReviewQuery } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import ReviewCommentList, { hasReviewComments } from '@/components/pages/protected/reviews/common/review-comment-list'

type TReviewSummaryPanelProps = {
  review?: ReviewQuery['review']
}

const EMPTY_VALUE = '—'

const ReviewSummaryPanel: React.FC<TReviewSummaryPanelProps> = ({ review }) => {
  const { convertToReadOnly } = usePlateEditor()

  return (
    <Panel className="p-4 flex flex-col gap-4">
      <p className="text-lg font-medium">Review</p>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Test Applied</span>
        {review?.details ? <div className="text-sm">{convertToReadOnly(review.details)}</div> : <span className="text-sm">{EMPTY_VALUE}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Auditor Notes</span>
        {hasReviewComments(review?.comments) ? <ReviewCommentList comments={review?.comments} showAuthor={false} /> : <span className="text-sm">{EMPTY_VALUE}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">External ID</span>
        <span className="text-sm">{review?.externalID || EMPTY_VALUE}</span>
      </div>
    </Panel>
  )
}

export default ReviewSummaryPanel
