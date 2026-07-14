'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, ArrowUpDown, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { useDeleteNote, useGetControlComments, useUpdateControl, useUpdateControlComment } from '@/lib/graphql-hooks/control'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { resolveAuthor } from '@/lib/authors'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import type { TComments } from '@/components/shared/comments/types/TComments'
import type { TCommentData } from '@/components/shared/comments/types/TCommentData'

type RequestInfoSheetProps = {
  controlId: string | null
  refCode?: string | null
  onClose: () => void
}

const RequestInfoSheet: React.FC<RequestInfoSheetProps> = ({ controlId, refCode, onClose }) => {
  const { data } = useGetControlComments(controlId)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateComment } = useUpdateControlComment()
  const { mutateAsync: deleteNote } = useDeleteNote()

  const commentSource = data?.control
  const userIds = useMemo(() => {
    const edges = commentSource?.comments?.edges ?? []
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((itemId): itemId is string => typeof itemId === 'string')))
  }, [commentSource])

  const { userMap, tokenMap, isLoading: isUsersLoading } = useAuthorMaps(userIds)

  const invalidateComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['controlComments', controlId] })
  }, [controlId, queryClient])

  const handleSendComment = useCallback(
    async (values: TComments) => {
      if (!controlId) return
      try {
        const comment = await plateEditorHelper.convertToHtml(values.comment)
        await updateControl({ updateControlId: controlId, input: { addComment: { text: comment } } })
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [controlId, plateEditorHelper, updateControl, invalidateComments, errorNotification],
  )

  const handleEditComment = useCallback(
    async (commentId: string, newValue: string) => {
      try {
        await updateComment({ updateControlCommentId: commentId, input: { text: newValue } })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [updateComment, errorNotification],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteNote({ deleteNoteId: commentId })
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [deleteNote, invalidateComments, errorNotification],
  )

  const handleCommentSort = useCallback(() => {
    setCommentSortIsAsc((prev) => !prev)
  }, [])

  const comments = useMemo(() => {
    if (!commentSource?.comments?.edges?.length) return []

    const mapped = commentSource.comments.edges.map(
      (item) =>
        ({
          comment: item?.node?.text,
          createdAt: item?.node?.createdAt,
          author: resolveAuthor(item?.node?.createdBy, { userMap, tokenMap }),
          createdBy: item?.node?.createdBy,
          id: item?.node?.id || '',
        }) as TCommentData,
    )

    return mapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
  }, [commentSortIsAsc, commentSource, tokenMap, userMap])

  return (
    <Sheet open={!!controlId} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        minWidth={480}
        className="flex flex-col"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl leading-8 font-medium">Request Info</span>
                {refCode && <span className="text-sm text-muted-foreground">{refCode}</span>}
              </div>
              <X aria-label="Close request info sheet" size={20} className="cursor-pointer" onClick={onClose} />
            </div>
          </SheetHeader>
        }
      >
        <p className="text-sm text-muted-foreground mb-4">Leave a comment on this control to request information from its owner.</p>
        <div className="flex justify-between items-end mb-2">
          <button type="button" className="flex items-center gap-1 text-right" onClick={handleCommentSort}>
            {!commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
            <p className="text-sm">{!commentSortIsAsc ? 'Newest at top' : 'Newest at bottom'}</p>
          </button>
        </div>

        {isUsersLoading && commentSource?.comments?.edges?.length ? (
          <div className="space-y-4">
            {commentSource.comments.edges.map((_, index) => (
              <div key={index} className="w-full p-2 mb-2 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton height={16} width={120} />
                      <Skeleton height={14} width={80} />
                    </div>
                    <Skeleton height={16} width="80%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        ) : (
          <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleRemoveComment} />
        )}
        <AddComment onSuccess={handleSendComment} />
      </SheetContent>
    </Sheet>
  )
}

export default RequestInfoSheet
