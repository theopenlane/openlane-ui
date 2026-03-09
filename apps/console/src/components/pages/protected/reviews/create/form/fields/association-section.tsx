'use client'

import { useCallback } from 'react'
import { useGetReviewAssociations, useUpdateReview } from '@/lib/graphql-hooks/review'
import type { UpdateReviewInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { REVIEW_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const ReviewAssociationSection = (props: BaseAssociationSectionProps) => {
  const entityId = props.data?.id
  const { data: associationsData } = useGetReviewAssociations(entityId)
  const { mutateAsync: updateReview } = useUpdateReview()

  const handleUpdateEntity = useCallback(
    async (input: Partial<UpdateReviewInput>) => {
      if (!entityId) return
      await updateReview({ updateReviewId: entityId, input })
    },
    [updateReview, entityId],
  )

  return <AssociationSection {...props} config={REVIEW_ASSOCIATION_CONFIG} associationsData={associationsData} onUpdateEntity={handleUpdateEntity} />
}
