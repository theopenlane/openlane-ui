'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { TComments } from '@/components/shared/comments/types/TComments'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { useParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetControlComments, useUpdateControl, useUpdateControlComment } from '@/lib/graphql-hooks/controls'
import { UserWhereInput } from '@repo/codegen/src/schema'
import { useGetSubcontrolComments, useUpdateSubcontrol, useUpdateSubcontrolComment } from '@/lib/graphql-hooks/subcontrol'
import { SheetTitle } from '@repo/ui/sheet'

const ControlCommentsSheet = () => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()

  const isSubcontrol = Boolean(subcontrolId)

  const { data } = useGetControlComments(!isSubcontrol ? id : null)
  const { data: subcontrolData } = useGetSubcontrolComments(isSubcontrol ? subcontrolId || id : null)

  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const [comments, setComments] = useState<TCommentData[]>([])

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateComment } = useUpdateControlComment()
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: updateSubComment } = useUpdateSubcontrolComment()

  const commentSource = isSubcontrol ? subcontrolData?.subcontrol : data?.control

  const where: UserWhereInput | undefined = commentSource?.comments
    ? {
        idIn: commentSource.comments.edges?.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
      }
    : undefined

  const { data: userData } = useGetUsers(where)

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
          queryClient.invalidateQueries({ queryKey: ['subcontrolComments', targetId] })
        } else {
          await updateControl({
            updateControlId: targetId,
            input: { addComment: { text: comment } },
          })
          queryClient.invalidateQueries({ queryKey: ['controlComments', targetId] })
        }
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [id, subcontrolId, isSubcontrol, plateEditorHelper, updateControl, updateSubcontrol, queryClient, errorNotification],
  )

  const handleEditComment = useCallback(
    async (commentId: string, newValue: string) => {
      try {
        if (isSubcontrol) {
          await updateSubComment({
            updateSubcontrolCommentId: commentId,
            input: { text: newValue },
          })
          queryClient.invalidateQueries({ queryKey: ['subcontrolComments', subcontrolId || id] })
        } else {
          await updateComment({
            updateControlCommentId: commentId,
            input: { text: newValue },
          })
          queryClient.invalidateQueries({ queryKey: ['controlComments', id] })
        }
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [id, subcontrolId, isSubcontrol, updateComment, updateSubComment, queryClient, errorNotification],
  )

  const handleRemoveComment = useCallback(
    async (commentId: string) => {
      const targetId = subcontrolId || id
      if (!targetId) return
      try {
        if (isSubcontrol) {
          await updateSubcontrol({
            updateSubcontrolId: targetId,
            input: { removeCommentIDs: [commentId] },
          })
          queryClient.invalidateQueries({ queryKey: ['subcontrolComments', targetId] })
        } else {
          await updateControl({
            updateControlId: targetId,
            input: { removeCommentIDs: [commentId] },
          })
          queryClient.invalidateQueries({ queryKey: ['controlComments', targetId] })
        }
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [id, subcontrolId, isSubcontrol, updateControl, updateSubcontrol, queryClient, errorNotification],
  )

  const handleCommentSort = useCallback(() => {
    const sorted = [...comments].sort((a, b) =>
      commentSortIsAsc ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    setCommentSortIsAsc((prev) => !prev)
    setComments(sorted)
  }, [commentSortIsAsc, comments])

  useEffect(() => {
    if (commentSource && userData?.users?.edges?.length) {
      const mapped =
        commentSource.comments?.edges?.map((item) => {
          const user = userData.users.edges?.find((u) => u?.node?.id === item?.node?.createdBy)?.node
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
        <p className="text-lg font-semibold">{isSubcontrol ? 'Subcontrol Comments' : 'Control Comments'}</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">Newest at bottom</p>
        </div>
      </div>

      <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleRemoveComment} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default ControlCommentsSheet
