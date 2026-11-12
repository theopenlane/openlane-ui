'use client'

import React, { useState } from 'react'
import { type TCommentData } from '@/components/shared/comments/types/TCommentData'
import { AuthorDisplay } from '@/components/shared/user-display/author-cell'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { formatDateTime } from '@/utils/date'
import PlateEditor from '../plate/plate-editor'
import { useSession } from 'next-auth/react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { type Value } from 'platejs'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useHasOrgFullAccess } from '@/lib/query-hooks/permissions'
import { Button } from '@repo/ui/button'

type CommentListProps = {
  comments: TCommentData[]
  onEdit?: (commentId: string, newValue: string) => Promise<void> | void
  onRemove?: (commentId: string) => Promise<void> | void
  showAuthor?: boolean
}

const CommentList: React.FC<CommentListProps> = ({ comments, onEdit, onRemove, showAuthor = true }) => {
  const { data: session } = useSession()
  const hasOrgFullAccess = useHasOrgFullAccess()
  const plateEditorHelper = usePlateEditor()

  const [isEditingItemId, setIsEditingItemId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState<Value | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<TCommentData | null>(null)

  const handleEditClick = (item: TCommentData) => {
    setIsEditingItemId(item.id)
    setDraftValue(null)
  }

  const handleCancelEdit = () => {
    setIsEditingItemId(null)
    setDraftValue(null)
  }

  const handleSaveEdit = async (item: TCommentData) => {
    if (!onEdit) return
    if (!draftValue) {
      setIsEditingItemId(null)
      return
    }
    const html = await plateEditorHelper.convertToHtml(draftValue)
    try {
      await onEdit(item.id, html)
    } catch {
      return
    }
    setIsEditingItemId(null)
    setDraftValue(null)
  }

  const confirmDelete = async () => {
    if (!commentToDelete || !onRemove) return
    try {
      await onRemove(commentToDelete.id)
    } catch {
      return
    }
    setDeleteDialogOpen(false)
    setCommentToDelete(null)
  }

  return (
    <>
      {comments.map((item) => {
        const canManageComment = item.createdBy === session?.user?.userId || hasOrgFullAccess
        const isEditing = isEditingItemId === item.id

        return (
          <div className="w-full p-2 mb-2 hover:bg-panel dark:hover:bg-panel rounded-lg transition-colors duration-500" key={item.id}>
            <div className="flex items-start space-x-3 overflow-auto">
              <div className="flex flex-col w-full min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showAuthor && <AuthorDisplay author={item.author} className="font-semibold" avatarClassName="h-10 w-10 mr-2" />}
                    <p className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                  </div>

                  {canManageComment && !isEditing && (onEdit || onRemove) && (
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button type="button" variant="icon" size="icon-xs" aria-label="Edit comment" onClick={() => handleEditClick(item)}>
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          type="button"
                          variant="icon"
                          size="icon-xs"
                          aria-label="Delete comment"
                          onClick={() => {
                            setCommentToDelete(item)
                            setDeleteDialogOpen(true)
                          }}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {canManageComment && isEditing && (
                    <div className="flex gap-2">
                      <Button type="button" variant="icon" size="icon-xs" aria-label="Save comment" onClick={() => handleSaveEdit(item)}>
                        <Check className="size-4 text-primary" />
                      </Button>
                      <Button type="button" variant="icon" size="icon-xs" aria-label="Cancel comment edit" onClick={handleCancelEdit}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-1">{isEditing ? <PlateEditor initialValue={item.comment} onChange={(val: Value) => setDraftValue(val)} /> : plateEditorHelper.convertToReadOnly(item.comment)}</div>
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
