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
import { TaskQuery } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

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

  const queryClient = useQueryClient()
  const { errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const handleSendComment = useCallback(
    async (data: TComments) => {
      if (!id) return
      try {
        const comment = await plateEditorHelper.convertToHtml(data.comment)
        await updateTask({
          updateTaskId: id,
          input: { addComment: { text: comment } },
        })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({ title: 'Error', description: errorMessage })
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
    if (taskData) {
      const comments = (taskData?.comments || [])?.edges?.map((item) => {
        const avatarUrl = item?.node?.owner?.avatarRemoteURL || item?.node?.owner?.avatarRemoteURL
        return {
          comment: item?.node?.text,
          avatarUrl,
          createdAt: item?.node?.createdAt,
          userName: item?.node?.owner?.displayName,
          createdBy: item?.node?.createdBy,
          id: item?.node?.id || '',
        } as TCommentData
      })
      const sortedComments = comments?.sort((a, b) => new Date(!commentSortIsAsc ? b.createdAt : a.createdAt).getTime() - new Date(!commentSortIsAsc ? a.createdAt : b.createdAt).getTime())
      setComments(sortedComments || [])
    }
  }, [commentSortIsAsc, taskData])

  if (isEditing) return null

  return (
    <div className="p-2 w-full mt-5">
      <div className="flex justify-between items-end mb-2">
        <p className="text-lg">Conversation</p>
        <div className="flex items-center gap-1 text-right cursor-pointer" onClick={handleCommentSort}>
          {commentSortIsAsc ? <ArrowDownUp height={16} width={16} /> : <ArrowUpDown height={16} width={16} className="text-primary" />}
          <p className="text-sm">Newest at bottom</p>
        </div>
      </div>

      <CommentList comments={comments} />
      <AddComment onSuccess={handleSendComment} />
    </div>
  )
}

export default Conversation
