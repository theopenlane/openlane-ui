'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { TComments } from '@/components/shared/comments/types/TComments'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useDeleteNote, useGetControlComments, useUpdateControl, useUpdateControlComment } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolComments, useUpdateSubcontrol, useUpdateSubcontrolComment } from '@/lib/graphql-hooks/subcontrol'
import { SheetTitle } from '@repo/ui/sheet'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members'

const ControlCommentsSheet = () => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()

  const isSubcontrol = !!subcontrolId

  const { data } = useGetControlComments(!isSubcontrol ? id : null)
  const { data: subcontrolData } = useGetSubcontrolComments(isSubcontrol ? subcontrolId : null)

  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const [comments, setComments] = useState<TCommentData[]>([])

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateComment } = useUpdateControlComment()
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: updateSubComment } = useUpdateSubcontrolComment()
  const { mutateAsync: deleteNote } = useDeleteNote()

  const commentSource = isSubcontrol ? subcontrolData?.subcontrol : data?.control
  const userIds = useMemo(() => {
    const edges = commentSource?.comments?.edges ?? []
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string')))
  }, [commentSource])

  const { data: userData } = useGetOrgMemberships({
    where: {
      hasUserWith: userIds.map((id) => ({ id })),
    },
    enabled: userIds.length > 0,
  })

  const invalidateComments = useCallback(() => {
    if (isSubcontrol) {
      queryClient.invalidateQueries({ queryKey: ['subcontrolComments', subcontrolId] })
    } else {
      queryClient.invalidateQueries({ queryKey: ['controlComments', id] })
    }
  }, [id, isSubcontrol, queryClient, subcontrolId])

  const handleSendComment = useCallback(
    async (data: TComments) => {
      const targetId = subcontrolId || id
      if (!targetId) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        if (isSubcontrol) {
          await updateSubcontrol({
            updateSubcontrolId: targetId,
            input: { addComment: { text: comment } },
          })
        } else {
          await updateControl({
            updateControlId: targetId,
            input: { addComment: { text: comment } },
          })
        }
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [id, subcontrolId, isSubcontrol, plateEditorHelper, updateControl, updateSubcontrol, errorNotification, invalidateComments],
  )

  const handleEditComment = useCallback(
    async (commentId: string, newValue: string) => {
      try {
        if (isSubcontrol) {
          await updateSubComment({
            updateSubcontrolCommentId: commentId,
            input: { text: newValue },
          })
        } else {
          await updateComment({
            updateControlCommentId: commentId,
            input: { text: newValue },
          })
        }
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [isSubcontrol, updateComment, updateSubComment, errorNotification],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      const targetId = subcontrolId || id
      if (!targetId) return
      try {
        await deleteNote({ deleteNoteId: commentId })
        invalidateComments()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [id, subcontrolId, deleteNote, errorNotification, invalidateComments],
  )

  const handleCommentSort = useCallback(() => {
    const sorted = [...comments].sort((a, b) =>
      commentSortIsAsc ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    setCommentSortIsAsc((prev) => !prev)
    setComments(sorted)
  }, [commentSortIsAsc, comments])

  useEffect(() => {
    if (commentSource && userData?.orgMemberships?.edges?.length) {
      const mapped =
        commentSource.comments?.edges?.map((item) => {
          const user = userData.orgMemberships.edges?.find((u) => u?.node?.user.id === item?.node?.createdBy)?.node?.user
          const avatarUrl = user?.avatarFile?.presignedURL || user?.avatarRemoteURL
          return {
            comment: item?.node?.text,
            avatarUrl,
            createdAt: item?.node?.createdAt,
            userName: user?.displayName,
            createdBy: item?.node?.createdBy,
            id: item?.node?.id || '',
          } as TCommentData
        }) ?? []

      const sorted = mapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())

      setComments(sorted)
    }
  }, [commentSortIsAsc, commentSource, userData])

  return (
    <div className="p-4 w-full h-full overflow-y-auto">
      <SheetTitle />
      <div className="flex justify-between items-end mb-2">
        <p className="text-lg font-semibold">Comments</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {!commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">{!commentSortIsAsc ? 'Newest at top' : 'Newest at bottom'}</p>
        </div>
      </div>

      <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleRemoveComment} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default ControlCommentsSheet
