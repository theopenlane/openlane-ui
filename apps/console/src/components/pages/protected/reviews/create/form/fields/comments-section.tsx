'use client'

import React, { useMemo } from 'react'
import { type ReviewQuery } from '@repo/codegen/src/schema'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { resolveAuthor } from '@/lib/authors'

type ReviewCommentsSectionProps = {
  data?: ReviewQuery['review']
  isCreate?: boolean
}

export const ReviewCommentsSection: React.FC<ReviewCommentsSectionProps> = ({ data, isCreate }) => {
  const edges = useMemo(() => data?.comments?.edges ?? [], [data])

  const userIds = useMemo(() => Array.from(new Set(edges.map((edge) => edge?.node?.createdBy).filter((id): id is string => typeof id === 'string'))), [edges])

  const { userMap, tokenMap } = useAuthorMaps(userIds)

  const comments = useMemo<TCommentData[]>(() => {
    return edges
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => !!node)
      .map((node) => ({
        id: node.id,
        comment: node.text,
        createdAt: node.createdAt,
        createdBy: node.createdBy ?? '',
        author: resolveAuthor(node.createdBy, { userMap, tokenMap }),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [edges, userMap, tokenMap])

  if (isCreate || comments.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <p className="text-lg font-medium mb-2">Comments</p>
      <CommentList comments={comments} />
    </div>
  )
}
