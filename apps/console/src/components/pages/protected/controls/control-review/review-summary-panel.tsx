'use client'

import React, { useMemo } from 'react'
import { Panel } from '@repo/ui/panel'
import { type ReviewQuery } from '@repo/codegen/src/schema'
import { HTML_SANITIZE_CONFIG, useHtmlPurifier } from '@/lib/html/sanitize-html'
import ReviewCommentList, { hasReviewComments } from '@/components/pages/protected/reviews/common/review-comment-list'

type TReviewSummaryPanelProps = {
  review?: ReviewQuery['review']
}

const EMPTY_VALUE = '—'

const ReviewSummaryPanel: React.FC<TReviewSummaryPanelProps> = ({ review }) => {
  const purifier = useHtmlPurifier()
  const details = review?.details
  const detailsHtml = useMemo(() => (details ? purifier.sanitize(details, HTML_SANITIZE_CONFIG) : ''), [purifier, details])

  return (
    <Panel className="p-4 flex flex-col gap-4">
      <p className="text-lg font-medium">Review</p>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Test Applied</span>
        {detailsHtml ? <div className="rich-text text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: detailsHtml }} /> : <span className="text-sm">{EMPTY_VALUE}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Auditor Notes</span>
        {hasReviewComments(review?.comments) ? <ReviewCommentList comments={review?.comments} /> : <span className="text-sm">{EMPTY_VALUE}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">External ID</span>
        <span className="text-sm">{review?.externalID || EMPTY_VALUE}</span>
      </div>
    </Panel>
  )
}

export default ReviewSummaryPanel
