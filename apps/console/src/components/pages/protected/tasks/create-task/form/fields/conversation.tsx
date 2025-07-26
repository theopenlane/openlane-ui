'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

import CommentList from '@/components/shared/comments/CommentList'
import AddComment from '@/components/shared/comments/AddComment'
import { TComments } from '@/components/shared/comments/types/TComments'
import { useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import { useSearchParams } from 'next/navigation'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { TaskQuery, UserWhereInput } from '@repo/codegen/src/schema'

type ConversationProps = {
  isEditing: boolean
  taskData: TaskQuery['task'] | undefined
}

const Conversation: React.FC<ConversationProps> = ({ isEditing, taskData }) => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [commentSortIsAsc, setCommentSortIsAsc] = useState(false)
  const [comments, setComments] = useState<TCommentData[]>([])

  const { mutateAsync: updateTask } = useUpdateTask()

  const where: UserWhereInput | undefined = taskData?.comments
    ? {
        idIn: taskData.comments.edges?.map((item) => item?.node?.createdBy).filter((id): id is string => typeof id === 'string'),
      }
    : undefined

  const { data: userData } = useGetUsers(where)

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!id) {
        return
      }

      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)

        await updateTask({
          updateTaskId: id,
          input: {
            addComment: {
              text: comment,
            },
          },
        })

        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } catch {
        errorNotification({
          title: 'Error',
          description: 'There was an unexpected error. Please try again later.',
        })
      }
    },
    [id, plateEditorHelper, updateTask, queryClient, errorNotification],
  )

  const handleCommentSort = () => {
    const sorted = [...comments].sort((a, b) => new Date(commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
    setCommentSortIsAsc((prev) => !prev)
    setComments(sorted)
  }

  useEffect(() => {
    if (taskData && userData && userData?.users?.edges?.length) {
      const comments = (taskData?.comments || [])?.edges?.map((item) => {
        const user = userData.users!.edges!.find((user) => user!.node!.id === item?.node?.createdBy)?.node
        const avatarUrl = user!.avatarFile?.presignedURL || user?.avatarRemoteURL
        return {
          comment: item?.node?.text,
          avatarUrl: avatarUrl,
          createdAt: item?.node?.createdAt,
          userName: user?.displayName,
        } as TCommentData
      })
      const sortedComments = comments?.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments || [])
    }
  }, [commentSortIsAsc, taskData, userData])

  if (isEditing) return null

  return (
    <div className="p-2 w-full mt-5">
      <div className="flex justify-between items-end">
        <p className="text-lg">Conversation</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-accent-secondary" />}
          <p className="text-sm">Newest at bottom</p>
        </div>
      </div>
      <CommentList comments={comments} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default Conversation
