'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useReview } from '@/lib/graphql-hooks/review'
import { useEntity } from '@/lib/graphql-hooks/entity'
import { useObjectPermission } from '@/components/shared/crud-base/use-object-permission'
import { canEdit } from '@/lib/authz/utils'
import { getEdgeIds, getEdgeNodes } from '@/components/shared/object-association/utils'
import { GenericDetailsSheetSkeleton } from '@/components/shared/crud-base/skeleton/details-sheet-skeleton'
import ControlReviewSheetBody from '@/components/pages/protected/controls/control-review/control-review-sheet-body'
import VendorReviewSheetBody from '@/components/pages/protected/vendors/detail/tabs/risk-review/vendor-review/vendor-review-sheet-body'
import ViewReviewSheet from '@/components/pages/protected/reviews/view-review-sheet'

type TReviewSheetResolverProps = {
  reviewId: string | null
  onClose: () => void
}

const ReviewSheetResolver: React.FC<TReviewSheetResolverProps> = ({ reviewId, onClose }) => {
  const { data: session } = useSession()
  const { data: reviewData, isError } = useReview(reviewId || undefined)
  const fetchedReview = reviewData?.review
  const review = reviewId && fetchedReview?.id === reviewId ? fetchedReview : undefined

  const vendorId = getEdgeIds(review?.vendorEntities?.edges)[0]
  const { data: vendorData, isError: isVendorError } = useEntity(vendorId)
  const fetchedVendor = vendorData?.entity
  const vendor = vendorId && fetchedVendor?.id === vendorId ? fetchedVendor : undefined
  const { roles: vendorRoles, isLoading: isLoadingVendorPermission } = useObjectPermission(ObjectTypes.ENTITY, vendorId)

  const controlId = getEdgeIds(review?.controls?.edges)[0] ?? getEdgeNodes(review?.subcontrols?.edges)[0]?.controlID

  const resolveContent = (): React.ReactNode => {
    if (!reviewId) {
      return undefined
    }

    if (!review) {
      return isError ? undefined : <GenericDetailsSheetSkeleton />
    }

    if (vendorId && !isVendorError) {
      if (!vendor || isLoadingVendorPermission) {
        return <GenericDetailsSheetSkeleton />
      }

      return <VendorReviewSheetBody vendor={vendor} review={review} canEditVendor={canEdit(vendorRoles, session)} onClose={onClose} />
    }

    return controlId ? <ControlReviewSheetBody controlId={controlId} reviewId={reviewId} onClose={onClose} /> : undefined
  }

  const content = resolveContent()

  return <ViewReviewSheet entityId={reviewId} onClose={onClose} overrideHeader={content ? <></> : undefined} overrideContent={content} />
}

export default ReviewSheetResolver
