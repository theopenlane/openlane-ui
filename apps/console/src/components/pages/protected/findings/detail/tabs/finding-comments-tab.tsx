'use client'

import React from 'react'
import CommentsSection from '@/components/shared/comments/comments-section'
import { useFindingComments } from '@/lib/graphql-hooks/finding'

const FindingCommentsTab: React.FC<{ findingId: string }> = ({ findingId }) => {
  const comments = useFindingComments(findingId)

  return <CommentsSection key={findingId} {...comments} />
}

export default FindingCommentsTab
