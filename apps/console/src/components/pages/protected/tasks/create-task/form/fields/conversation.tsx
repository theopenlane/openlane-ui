'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { TComments } from '@/components/shared/comments/types/TComments'
import { useUpdateTask, useUpdateTaskComment } from '@/lib/graphql-hooks/tasks'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useSearchParams } from 'next/navigation'
import { TaskQuery } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useDeleteNote } from '@/lib/graphql-hooks/controls'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members'

type ConversationProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
}

const Conversation: React.FC<ConversationProps> = ({ isEditing, taskData }) => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const [comments, setComments] = useState<TCommentData[]>([])

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

  const { data: userData } = useGetOrgMemberships({
    where: {
      hasUserWith: userIds.map((id) => ({ id })),
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

  const handleCommentSort = () => {
    const sorted = [...comments].sort((a, b) => new Date(commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
    setCommentSortIsAsc((prev) => !prev)
    setComments(sorted)
  }

  useEffect(() => {
    if (taskData && userData?.orgMemberships?.edges?.length) {
      const commentsMapped = (taskData?.comments?.edges || []).map((item) => {
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
      })

      const sortedComments = commentsMapped.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments)
    }
  }, [commentSortIsAsc, taskData, userData])

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

      <CommentList comments={comments} onEdit={handleEditComment} onRemove={handleDeleteComment} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default Conversation
