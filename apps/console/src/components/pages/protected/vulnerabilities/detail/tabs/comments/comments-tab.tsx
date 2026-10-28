'use client'

import React from 'react'
import CommentsSection from '@/components/shared/comments/comments-section'
import { useVulnerabilityComments } from '@/lib/graphql-hooks/vulnerability'

const CommentsTab: React.FC<{ vulnerabilityId: string }> = ({ vulnerabilityId }) => {
  const comments = useVulnerabilityComments(vulnerabilityId)

  return <CommentsSection key={vulnerabilityId} {...comments} />
}

export default CommentsTab
