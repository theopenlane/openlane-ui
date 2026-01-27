'use client'

import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Keyboard, Megaphone, Pencil, Loader2, Trash2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { useGetTrustCenter, useGetTrustCenterPosts, useUpdateTrustCenter, useUpdateTrustCenterPost } from '@/lib/graphql-hooks/trust-center'
import { Label } from '@repo/ui/label'
import { formatDate } from '@/utils/date'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Input } from '@repo/ui/input'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(280),
  text: z.string().min(1, 'Update text is required').max(280),
})

type UpdateFormValues = z.infer<typeof formSchema>

export default function UpdatesSection() {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [postToDelete, setPostToDelete] = useState<string | null>(null) // New state for deletion

  const { successNotification, errorNotification } = useNotification()
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''

  const { data: postsData } = useGetTrustCenterPosts({ trustCenterId: trustCenterID })
  const posts = postsData?.trustCenter?.posts?.edges ?? []

  const { mutateAsync: updateTrustCenter, isPending: isCreating } = useUpdateTrustCenter()
  const { mutateAsync: updatePost, isPending: isUpdating } = useUpdateTrustCenterPost()

  const createForm = useForm<UpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: '', title: '' },
  })

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: '', title: '' },
  })

  const createTextValue = createForm.watch('text')
  const editTextValue = editForm.watch('text')

  const createCharsRemaining = 280 - (createTextValue?.length || 0)
  const editCharsRemaining = 280 - (editTextValue?.length || 0)

  // --- Handlers ---

  const handleCreateSubmit = async (values: UpdateFormValues) => {
    try {
      await updateTrustCenter({
        updateTrustCenterId: trustCenterID,
        input: { addPost: { text: values.text, title: values.title } },
      })
      successNotification({ title: 'Update published', description: 'Your trust center update has been successfully posted.' })
      createForm.reset()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleUpdateSubmit = async (values: UpdateFormValues) => {
    if (!editingPostId) return
    try {
      await updatePost({
        updateTrustCenterPostId: editingPostId,
        input: { text: values.text, title: values.title },
      })
      successNotification({ title: 'Update saved', description: 'The changes to your post have been saved.' })
      setEditingPostId(null)
      editForm.reset()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!postToDelete) return
    try {
      await updateTrustCenter({ updateTrustCenterId: trustCenterID, input: { removePostIDs: [postToDelete] } })
      successNotification({ title: 'Update deleted', description: 'The post has been removed.' })
      setPostToDelete(null)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const startEditing = (postId: string, currentText: string, currentTitle: string) => {
    setEditingPostId(postId)
    editForm.setValue('text', currentText)
    editForm.setValue('title', currentTitle || '')
  }

  const cancelEditing = () => {
    setEditingPostId(null)
    editForm.reset()
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen text-foreground">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Updates</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={editingPostId ? 'opacity-50 pointer-events-none' : ''}>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Share Update</h2>

              <p className="text-sm text-muted-foreground">Share brief updates about changes in your security practices.</p>
            </div>

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-2">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Title</FormLabel>

                      <FormControl>
                        <Input placeholder="Add a title" className="bg-background" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Description</FormLabel>

                      <FormControl>
                        <Textarea placeholder="Write an update..." className="min-h-[120px] bg-background" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Keyboard size={16} />

                    <span className={createCharsRemaining < 0 ? 'text-destructive font-medium' : ''}>{createCharsRemaining} characters remaining</span>
                  </div>

                  <Button type="submit" disabled={isCreating || !!editingPostId} icon={isCreating ? <Loader2 className="animate-spin" /> : <Megaphone />} iconPosition="left">
                    Publish Update
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="relative min-h-[400px]">
          {posts.length === 0 ? (
            <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8">
              <Megaphone size={24} className="mb-4 text-muted-foreground" />
              <h3 className="text-sm font-medium mb-1 text-foreground">No updates posted yet</h3>
              <p className="text-sm text-muted-foreground">Send your first update to see them here</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2">
              {posts.map((edge) => {
                const post = edge?.node
                if (!post) return null
                const isBeingEdited = editingPostId === post.id

                return (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      {isBeingEdited ? (
                        <div className="space-y-3">
                          <Label>Title</Label>
                          <Input autoFocus className="bg-background text-sm" {...editForm.register('title')} />
                          <Label>Description</Label>
                          <Textarea autoFocus className="min-h-[100px] bg-background text-sm" {...editForm.register('text')} />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Keyboard size={16} />
                              <span className={editCharsRemaining < 0 ? 'text-destructive font-medium' : ''}>{editCharsRemaining} characters remaining</span>
                            </div>
                            <div className="flex gap-2">
                              <CancelButton onClick={cancelEditing}></CancelButton>
                              <SaveButton isSaving={isUpdating} onClick={editForm.handleSubmit(handleUpdateSubmit)} disabled={isUpdating} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <p className="text-sm leading-relaxed flex-1">{post.title}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.text}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-muted-foreground text-sm">{formatDate(post.updatedAt)}</p>
                            <div className="flex gap-3">
                              <button className="text-muted-foreground" onClick={() => startEditing(post.id, post.text, post.title ?? '')} disabled={!!editingPostId}>
                                <Pencil size={16} />
                              </button>
                              <button className="text-muted-foreground " onClick={() => setPostToDelete(post.id)} disabled={!!editingPostId}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!postToDelete}
        onOpenChange={(open) => !open && setPostToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Update"
        description="Are you sure you want to delete this update? This action cannot be undone."
      />
    </div>
  )
}
