'use client'

import React, { useCallback, useId, useMemo } from 'react'
import AddComment from '@/components/shared/comments/AddComment'
import CommentList from '@/components/shared/comments/CommentList'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { type TComments } from '@/components/shared/comments/types/TComments'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useNotification } from '@/hooks/useNotification'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { resolveAuthor } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type TEntityComments } from '@/lib/graphql-hooks/entity-comments'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { compareByCreatedAt } from '@/lib/sort'

type TCommentsSectionProps = TEntityComments & {
  showHeading?: boolean
}

const CommentsSection: React.FC<TCommentsSectionProps> = ({ comments, totalCount, isLoading, error, canAttachFiles, addComment, editComment, removeComment, showHeading = true }) => {
  const headingId = useId()
  const plateEditorHelper = usePlateEditor()
  const { errorNotification } = useNotification()
  useQueryErrorNotification({ error, description: 'Failed to load comments' })

  const authorIds = useMemo(() => comments.map((node) => node.createdBy), [comments])
  const { userMap, tokenMap, isLoading: isAuthorsLoading } = useAuthorMaps(authorIds)
  const hasNoResolvedAuthors = isAuthorsLoading && comments.every((node) => !node.createdBy || (!userMap[node.createdBy] && !tokenMap[node.createdBy]))

  const items = useMemo<TCommentData[]>(
    () =>
      comments
        .map((node) => ({
          id: node.id,
          comment: node.text,
          createdAt: node.createdAt ?? '',
          createdBy: node.createdBy ?? '',
          author: resolveAuthor(node.createdBy, { userMap, tokenMap }),
          files: getNodes(node.files),
        }))
        .sort(compareByCreatedAt),
    [comments, userMap, tokenMap],
  )

  const notifyOnFailure = useCallback(
    async (title: string, action: () => Promise<void>) => {
      try {
        await action()
      } catch (failure) {
        errorNotification({ title, description: parseErrorMessage(failure) })
        throw failure
      }
    },
    [errorNotification],
  )

  const handleAdd = useCallback(
    (data: TComments) =>
      notifyOnFailure('Failed to add comment', async () => {
        const outcome = await addComment(await plateEditorHelper.convertToHtml(data.comment), data.files)
        if (outcome === 'posted-without-attachments') {
          errorNotification({ title: 'Attachments not uploaded', description: 'Your comment was posted without its attachments. Please try attaching them again later.' })
        }
      }),
    [notifyOnFailure, addComment, plateEditorHelper, errorNotification],
  )

  const handleEdit = useCallback((commentId: string, html: string) => notifyOnFailure('Failed to update comment', () => editComment(commentId, html)), [notifyOnFailure, editComment])

  const handleRemove = useCallback((commentId: string) => notifyOnFailure('Failed to delete comment', () => removeComment(commentId)), [notifyOnFailure, removeComment])

  const renderList = () => {
    if (isLoading || (comments.length > 0 && hasNoResolvedAuthors)) {
      return (
        <div className="space-y-2" role="status" aria-live="polite" aria-label="Loading comments">
          <SkeletonRows count={Math.max(comments.length, 1)} height={56} />
        </div>
      )
    }
    if (error) {
      return <p className="text-sm text-destructive">Comments could not be loaded.</p>
    }
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">No comments yet</p>
    }
    return (
      <>
        {totalCount > items.length && (
          <p className="text-sm text-muted-foreground">
            Showing the latest {items.length} of {totalCount} comments
          </p>
        )}
        <CommentList comments={items} onEdit={handleEdit} onRemove={handleRemove} />
      </>
    )
  }

  return (
    <section className="space-y-3" aria-labelledby={showHeading ? headingId : undefined}>
      {showHeading && (
        <h3 id={headingId} className="text-lg font-semibold">
          Comments
        </h3>
      )}
      {renderList()}
      <AddComment onSuccess={handleAdd} canAttachFiles={canAttachFiles} />
    </section>
  )
}

export default CommentsSection
