import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteNote, useGetControlComments, useUpdateControl, useUpdateControlComment } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolComments, useUpdateSubcontrol, useUpdateSubcontrolComment } from '@/lib/graphql-hooks/subcontrol'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import Skeleton from '@/components/shared/skeleton/skeleton'
import type { TComments } from '@/components/shared/comments/types/TComments'
import type { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { toBase64DataUri } from '@/lib/image-utils'

const ActivityCommentsSection = () => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()
  const isSubcontrol = !!subcontrolId

  const { data } = useGetControlComments(!isSubcontrol ? id : null)
  const { data: subcontrolData } = useGetSubcontrolComments(isSubcontrol ? subcontrolId : null)
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)

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
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((itemId): itemId is string => typeof itemId === 'string')))
  }, [commentSource])

  const { data: userData, isLoading: isUsersLoading } = useGetOrgMemberships({
    where: { hasUserWith: [{ idIn: userIds }] },
    enabled: userIds.length > 0,
  })

  const userMap = useMemo(() => {
    const map: Record<string, { id: string; displayName?: string | null; avatarFile?: { base64?: string | null } | null; avatarRemoteURL?: string | null }> = {}
    userData?.orgMemberships?.edges?.forEach((edge) => {
      const user = edge?.node?.user
      if (user) map[user.id] = user
    })
    return map
  }, [userData])

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
    setCommentSortIsAsc((prev) => !prev)
  }, [])

  const comments = useMemo(() => {
    if (!commentSource?.comments?.edges?.length) return []

    const mapped = commentSource.comments.edges.map((item) => {
      const user = item?.node?.createdBy ? userMap[item.node.createdBy] : undefined
      const avatarUrl = (user?.avatarFile?.base64 ? toBase64DataUri(user.avatarFile.base64) : null) || user?.avatarRemoteURL
      return {
        comment: item?.node?.text,
        avatarUrl,
        createdAt: item?.node?.createdAt,
        userName: user?.displayName || 'Deleted user',
        createdBy: item?.node?.createdBy,
        id: item?.node?.id || '',
      } as TCommentData
    })

    return mapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
  }, [commentSortIsAsc, commentSource, userMap])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
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
    </div>
  )
}

export default ActivityCommentsSection
