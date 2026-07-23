'use client'

import React, { useMemo } from 'react'
import { type ReviewQuery } from '@repo/codegen/src/schema'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { resolveAuthor } from '@/lib/authors'
import { getEdgeNodes } from '@/components/shared/object-association/utils'

type TReviewCommentListProps = {
  comments?: NonNullable<ReviewQuery['review']>['comments']
}

export const hasReviewComments = (comments: TReviewCommentListProps['comments']) => getEdgeNodes(comments?.edges).length > 0

const ReviewCommentList: React.FC<TReviewCommentListProps> = ({ comments }) => {
  const nodes = useMemo(() => getEdgeNodes(comments?.edges), [comments])

  const userIds = useMemo(() => Array.from(new Set(nodes.map((node) => node.createdBy).filter((id): id is string => typeof id === 'string'))), [nodes])

  const { userMap, tokenMap } = useAuthorMaps(userIds)

  const items = useMemo<TCommentData[]>(
    () =>
      nodes
        .map((node) => ({
          id: node.id,
          comment: node.text,
          createdAt: node.createdAt,
          createdBy: node.createdBy ?? '',
          author: resolveAuthor(node.createdBy, { userMap, tokenMap }),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [nodes, userMap, tokenMap],
  )

  return <CommentList comments={items} />
}

export default ReviewCommentList
