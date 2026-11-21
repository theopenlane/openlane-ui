'use client'

import React from 'react'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import CommentsSection from '@/components/shared/comments/comments-section'
import { DiscussionThreads } from '@/components/shared/comments/discussion-threads'
import { useGetPolicyDiscussionById, usePolicyComments } from '@/lib/graphql-hooks/internal-policy'

type TCommentsTabProps = {
  policy: InternalPolicyByIdFragment
}

export const CommentsTab: React.FC<TCommentsTabProps> = ({ policy }) => {
  const comments = usePolicyComments(policy.id)
  const { data: discussionData, isPending, isPlaceholderData, isError } = useGetPolicyDiscussionById(policy.id)

  return (
    <div className="space-y-8 pt-4">
      <CommentsSection {...comments} />
      <DiscussionThreads
        key={policy.id}
        entity={discussionData?.internalPolicy}
        document={policy.detailsJSON}
        entityLabel="policy"
        isLoading={(isPending || isPlaceholderData) && !isError}
        isError={isError}
      />
    </div>
  )
}
