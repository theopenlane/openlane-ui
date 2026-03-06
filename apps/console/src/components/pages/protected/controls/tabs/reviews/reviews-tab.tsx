'use client'

import React, { useMemo } from 'react'
import ReviewsTable from './reviews-table'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { buildAssociationFilter } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { ReviewWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/pages/protected/controls/tabs/shared/empty-tab-state'

type ReviewsTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ controlId, subcontrolIds }) => {
  const hasAssociationTarget = Boolean(controlId) || subcontrolIds.length > 0

  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const { data: reviewsData, isLoading } = useReviewsWithFilter({
    where: associationFilter as ReviewWhereInput,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget,
  })

  if (!hasAssociationTarget) {
    return null
  }

  const hasData = (reviewsData?.reviews?.totalCount ?? 0) > 0

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasData) {
    return <EmptyTabState description="Reviews of this control will appear here once auditors or reviewers have tested it." />
  }

  return <ReviewsTable controlId={controlId} subcontrolIds={subcontrolIds} />
}

export default ReviewsTab
