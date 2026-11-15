'use client'

import React from 'react'
import CommentsSection from '@/components/shared/comments/comments-section'
import { useVulnerabilityComments } from '@/lib/graphql-hooks/vulnerability'

const CommentsTab: React.FC<{ vulnerabilityId: string }> = ({ vulnerabilityId }) => {
  const comments = useVulnerabilityComments(vulnerabilityId)

  return (
    <div className="mt-6 pb-4">
      <CommentsSection key={vulnerabilityId} {...comments} />
    </div>
  )
}

export default CommentsTab
