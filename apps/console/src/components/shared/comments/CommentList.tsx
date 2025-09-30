'use client'

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { formatDateTime } from '@/utils/date'
import PlateEditor from '../plate/plate-editor'
import { useSession } from 'next-auth/react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Value } from 'platejs'
import { useUpdateTask, useUpdateTaskComment } from '@/lib/graphql-hooks/tasks'
import { useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type TProps = {
  comments: TCommentData[]
}

const CommentList: React.FC<TProps> = ({ comments }) => {
  const { data: session } = useSession()
  const plateEditorHelper = usePlateEditor()
  const searchParams = useSearchParams()
  const taskId = searchParams.get('id')

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: updateTaskComment } = useUpdateTaskComment()
  const { errorNotification, successNotification } = useNotification()

  const [isEditingItemId, setIsEditingItemId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState<Value | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<TCommentData | null>(null)

  const handleEdit = (item: TCommentData) => {
    setIsEditingItemId(item.id)
    setDraftValue(item.comment as unknown as Value)
  }

  const handleCancelEdit = () => {
    setIsEditingItemId(null)
    setDraftValue(null)
  }

  const handleSaveEdit = async (item: TCommentData) => {
    if (!taskId || !draftValue) return
    try {
      const html = await plateEditorHelper.convertToHtml(draftValue)
      await updateTaskComment({
        updateTaskCommentId: item.id,
        input: { text: html },
      })
      setIsEditingItemId(null)
      setDraftValue(null)

      successNotification({
        title: 'Comment updated',
        description: 'Your comment has been successfully updated.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  const confirmDelete = async () => {
    if (!taskId || !commentToDelete) return
    try {
      await updateTask({
        updateTaskId: taskId,
        input: { removeCommentIDs: [commentToDelete.id] },
      })
      setDeleteDialogOpen(false)
      setCommentToDelete(null)

      successNotification({
        title: 'Comment deleted',
        description: 'Your comment has been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    }
  }

  return (
    <>
      {comments.map((item, index) => {
        const isOwner = item.createdBy === session?.user?.userId
        const isEditing = isEditingItemId === item.id

        return (
          <div className="w-full p-2 mb-2 hover:bg-panel dark:hover:bg-panel rounded-lg transition-color duration-500" key={`${item.id}-${index}`}>
            <div className="flex items-start space-x-3">
              <Avatar variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10 mr-2">
                {item?.avatarUrl && <AvatarImage src={item.avatarUrl} />}
                <AvatarFallback>{item.userName?.substring(0, 2)}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col w-full min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline space-x-2">
                    <p className="font-semibold">{item.userName}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="hover:text-btn-secondary bg-unset">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCommentToDelete(item)
                          setDeleteDialogOpen(true)
                        }}
                        className="hover:text-destructive bg-unset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {isOwner && isEditing && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(item)}>
                        <Check className="h-4 w-4 text-brand" />
                      </button>
                      <button onClick={handleCancelEdit}>
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-1">
                  {isEditing ? <PlateEditor initialValue={item.comment as string} onChange={(val: Value) => setDraftValue(val)} /> : plateEditorHelper.convertToReadOnly(item.comment)}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmationText="Delete"
        confirmationTextVariant="destructive"
      />
    </>
  )
}

export default CommentList
