'use client'

import React from 'react'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { type EntityQuery } from '@repo/codegen/src/schema'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import VendorReviewSheetBody from './vendor-review-sheet-body'

type TVendorReviewSheetProps = {
  vendor: EntityQuery['entity']
  review?: ReviewsNodeNonNull
  canEditVendor: boolean
  onClose: () => void
}

const VendorReviewSheet: React.FC<TVendorReviewSheetProps> = ({ vendor, review, canEditVendor, onClose }) => (
  <Sheet open onOpenChange={(next) => (next ? undefined : onClose())}>
    <SheetContent minWidth={600} className="flex flex-col">
      <VendorReviewSheetBody vendor={vendor} review={review} canEditVendor={canEditVendor} onClose={onClose} />
    </SheetContent>
  </Sheet>
)

export default VendorReviewSheet
