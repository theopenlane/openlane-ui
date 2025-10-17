'use client'

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { formatDateTime } from '@/utils/date'
import PlateEditor from '../plate/plate-editor'
import { useSession } from 'next-auth/react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Value } from 'platejs'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type CommentListProps = {
  comments: TCommentData[]
  onEdit?: (commentId: string, newValue: string) => Promise<void> | void
  onRemove?: (commentId: string) => Promise<void> | void
}

const CommentList: React.FC<CommentListProps> = ({ comments, onEdit, onRemove }) => {
  const { data: session } = useSession()
  const plateEditorHelper = usePlateEditor()

  const [isEditingItemId, setIsEditingItemId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState<Value | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<TCommentData | null>(null)

  const handleEditClick = (item: TCommentData) => {
    setIsEditingItemId(item.id)
    setDraftValue(item.comment as unknown as Value)
  }

  const handleCancelEdit = () => {
    setIsEditingItemId(null)
    setDraftValue(null)
  }

  const handleSaveEdit = async (item: TCommentData) => {
    if (!draftValue || !onEdit) return
    const html = await plateEditorHelper.convertToHtml(draftValue)
    await onEdit(item.id, html)
    setIsEditingItemId(null)
    setDraftValue(null)
  }

  const confirmDelete = async () => {
    if (!commentToDelete || !onRemove) return
    await onRemove(commentToDelete.id)
    setDeleteDialogOpen(false)
    setCommentToDelete(null)
  }

  return (
    <>
      {comments.map((item) => {
        const isOwner = item.createdBy === session?.user?.userId
        const isEditing = isEditingItemId === item.id

        return (
          <div className="w-full p-2 mb-2 hover:bg-panel dark:hover:bg-panel rounded-lg transition-colors duration-500" key={item.id}>
            <div className="flex items-start space-x-3 overflow-auto">
              <Avatar variant="medium" className="h-10 w-10 mr-2">
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
                      <button onClick={() => handleEditClick(item)} className="hover:text-btn-secondary bg-unset">
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
