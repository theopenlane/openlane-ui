'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { type TComments } from '@/components/shared/comments/types/TComments'
import { useUpdateTask, useUpdateTaskComment } from '@/lib/graphql-hooks/task'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useSearchParams } from 'next/navigation'
import { type TaskQuery } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useDeleteNote } from '@/lib/graphql-hooks/control'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import Skeleton from '@/components/shared/skeleton/skeleton'

type ConversationProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
}

const Conversation: React.FC<ConversationProps> = ({ isEditing, taskData }) => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)

  const queryClient = useQueryClient()
  const { errorNotification, successNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: updateTaskComment } = useUpdateTaskComment()
  const { mutateAsync: deleteNote } = useDeleteNote()

  const userIds = React.useMemo(() => {
    const edges = taskData?.comments?.edges ?? []
    return Array.from(new Set(edges.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string')))
  }, [taskData])

  const { data: userData, isLoading: isUsersLoading } = useGetOrgMemberships({
    where: {
      hasUserWith: [{ idIn: userIds }],
    },
    enabled: userIds.length > 0,
  })

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!id) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        await updateTask({
          updateTaskId: id,
          input: { addComment: { text: comment } },
        })
        await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({ title: 'Error', description: errorMessage })
      }
    },
    [id, plateEditorHelper, updateTask, queryClient, errorNotification],
  )

  const handleEditComment = async (commentId: string, newHtml: string) => {
    try {
      await updateTaskComment({
        updateTaskCommentId: commentId,
        input: { text: newHtml },
      })
      successNotification({
        title: 'Comment updated',
        description: 'Your comment has been successfully updated.',
      })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return
    try {
      await deleteNote({ deleteNoteId: commentId })
      successNotification({
        title: 'Comment deleted',
        description: 'Your comment has been successfully deleted.',
      })
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  const handleCommentSort = useCallback(() => {
    setCommentSortIsAsc((prev) => !prev)
  }, [])

  const userMap = useMemo(() => {
    const map: Record<string, { id: string; displayName?: string | null; avatarFile?: { presignedURL?: string | null } | null; avatarRemoteURL?: string | null }> = {}
    userData?.orgMemberships?.edges?.forEach((edge) => {
      const user = edge?.node?.user
      if (user) map[user.id] = user
    })
    return map
  }, [userData])

  const comments = useMemo(() => {
    if (!taskData?.comments?.edges?.length) return []

    const mapped = taskData.comments.edges.map((item) => {
      const user = item?.node?.createdBy ? userMap[item.node.createdBy] : undefined
      const avatarUrl = user?.avatarFile?.presignedURL || user?.avatarRemoteURL
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
  }, [commentSortIsAsc, taskData, userMap])

  if (isEditing) return null

  return (
    <div className="p-2 w-full mt-5">
      <div className="flex justify-between items-end mb-2">
        <p className="text-lg">Conversation</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {!commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">{!commentSortIsAsc ? 'Newest at top' : 'Newest at bottom'}</p>
        </div>
      </div>

      {isUsersLoading && taskData?.comments?.edges?.length ? (
        <div className="space-y-4">
          {taskData.comments.edges.map((_, index) => (
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
      ) : (
        <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleDeleteComment} />
      )}
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default Conversation
