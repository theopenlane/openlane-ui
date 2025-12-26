'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { PanelRightClose, Pencil, Trash2, LinkIcon, Check } from 'lucide-react'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useCreateTag, useUpdateTag, useDeleteTag, useGetTagDetails } from '@/lib/graphql-hooks/tags'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  aliases: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
})

type FormData = z.infer<typeof schema>

export const CreateTagSheet = ({ resetPagination }: { resetPagination: () => void }) => {
  const router = useRouter()
  const params = useSearchParams()
  const { successNotification, errorNotification } = useNotification()

  const isCreate = params.get('create') === 'true'
  const id = params.get('id')
  const isEditMode = !!id

  const [isEditing, setIsEditing] = useState(isCreate)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const { mutateAsync: createTag } = useCreateTag()
  const { mutateAsync: updateTag } = useUpdateTag()
  const { mutateAsync: deleteTag } = useDeleteTag()
  const { data: tagData } = useGetTagDetails(id)

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      aliases: '',
      description: '',
      color: '#6366f1',
    },
  })

  const { handleSubmit, reset, formState, control } = formMethods
  const { isSubmitting } = formState

  const { field: colorField } = useController({
    name: 'color',
    control,
  })

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      const current = new URLSearchParams(window.location.search)
      current.delete('create')
      current.delete('id')
      router.push(`?${current.toString()}`)
      reset()
    }
  }

  const handleCopyLink = () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`
    let url = baseUrl

    if (isEditMode && id) {
      url += `?id=${id}`
    } else if (isCreate) {
      url += `?create=true`
    }

    navigator.clipboard
      .writeText(url)
      .then(() => successNotification({ title: 'Link copied to clipboard' }))
      .catch(() => errorNotification({ title: 'Failed to copy link' }))
  }

  const prefillForm = useCallback(() => {
    if (!tagData?.tagDefinition) return
    const t = tagData.tagDefinition
    reset({
      name: t.name ?? '',
      aliases: Array.isArray(t.aliases) ? t.aliases.join(', ') : t.aliases ?? '',
      description: t.description ?? '',
      color: t.color?.startsWith('#') ? t.color : `#${t.color || '6366f1'}`,
    })
  }, [tagData, reset])

  useEffect(() => {
    if (id || isCreate) {
      setOpen(true)
      setIsEditing(isCreate)
    } else {
      setOpen(false)
    }
  }, [id, isCreate])

  useEffect(() => {
    if (isEditMode && tagData?.tagDefinition) prefillForm()
  }, [isEditMode, tagData, prefillForm])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        await updateTag({
          updateTagDefinitionId: id!,
          input: {
            description: data.description,
            color: data.color,
            aliases: data.aliases
              ?.split(',')
              .map((a) => a.trim())
              .filter(Boolean),
          },
        })
        successNotification({ title: 'Tag updated' })
        setIsEditing(false)
      } else {
        await createTag({
          input: {
            name: data.name,
            description: data.description,
            color: data.color,
            aliases: data.aliases
              ?.split(',')
              .map((a) => a.trim())
              .filter(Boolean),
          },
        })
        successNotification({ title: 'Tag created' })
        handleOpenChange(false)
      }
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error', description: parseErrorMessage(err) })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteTag({ deleteTagDefinitionId: id })
      successNotification({ title: 'Tag Deleted' })
      setDeleteDialogOpen(false)
      handleOpenChange(false)
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="p-6 space-y-0 border-b">
          <div className="flex items-center justify-between">
            <PanelRightClose size={18} className="cursor-pointer transition-colors" onClick={() => handleOpenChange(false)} />
            <div className="flex items-center gap-2">
              <Button icon={<LinkIcon size={14} />} variant="secondary" onClick={handleCopyLink}>
                Copy link
              </Button>

              {isEditMode && !isEditing ? (
                <>
                  <Button variant="secondary" onClick={() => setIsEditing(true)} icon={<Pencil size={14} />}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => setDeleteDialogOpen(true)} icon={<Trash2 size={14} />}>
                    Delete
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (isEditMode) {
                        setIsEditing(false)
                        prefillForm()
                      } else {
                        handleOpenChange(false)
                      }
                    }}
                  >
                    Cancel
                  </Button>

                  <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} icon={isEditMode || isSubmitting ? <Check size={14} /> : undefined}>
                    {isSubmitting ? 'Saving...' : isCreate ? 'Create Tag' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <SheetTitle className="text-xl font-semibold">{isCreate ? 'Create Custom Tag' : tagData?.tagDefinition?.name}</SheetTitle>
            <SheetDescription className="sr-only">Tag management form</SheetDescription>
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="tag-form" className="p-6 space-y-6">
            {isCreate && (
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider">Name</label>
                <Input {...formMethods.register('name')} disabled={!isEditing || isEditMode} placeholder="e.g. High Priority" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider">Aliases</label>
              <Input {...formMethods.register('aliases')} disabled={!isEditing} placeholder="e.g. Critical, Urgent" />
            </div>

            <ColorInput label="Select Color" value={colorField.value} onChange={colorField.onChange} disabled={!isEditing} />

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider">Description</label>
              <Textarea {...formMethods.register('description')} disabled={!isEditing} placeholder="1-2 lines max" className="min-h-[100px]" />
            </div>
          </form>
        </FormProvider>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Tag"
          description={`Are you sure you want to delete "${tagData?.tagDefinition?.name}"? This action cannot be undone.`}
          confirmationText="Delete"
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  )
}
