'use client'

import React, { useEffect, useState } from 'react'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PanelRightClose, Trash2, LinkIcon, LoaderCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useCreateTag, useUpdateTag, useDeleteTag, useGetTagDetails } from '@/lib/graphql-hooks/tags'
import { SaveButton } from '@/components/shared/save-button/save-button'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  aliases: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
})

type FormData = z.infer<typeof schema>

export const CreateTagSheet = ({ resetPagination }: { resetPagination: () => void }) => {
  const params = useSearchParams()
  const { replace } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()

  const isCreate = params.get('create') === 'true'
  const id = params.get('id')
  const isEditMode = !!id

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const { data: tagData, isLoading: isLoadingDetails } = useGetTagDetails(id)
  const { mutateAsync: createTag, isPending: isCreating } = useCreateTag()
  const { mutateAsync: updateTag, isPending: isUpdating } = useUpdateTag()
  const { mutateAsync: deleteTag, isPending: isDeleting } = useDeleteTag()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      aliases: '',
      description: '',
      color: '#6366f1',
    },
  })

  const { control, handleSubmit, reset, setValue } = formMethods
  const { field: colorField } = useController({ name: 'color', control })

  useEffect(() => {
    if (tagData?.tagDefinition) {
      const t = tagData.tagDefinition
      setValue('name', t.name ?? '')
      setValue('aliases', Array.isArray(t.aliases) ? t.aliases.join(', ') : (t.aliases ?? ''))
      setValue('description', t.description ?? '')
      setValue('color', t.color?.startsWith('#') ? t.color : `#${t.color || '6366f1'}`)
    }
  }, [tagData, setValue])

  useEffect(() => {
    if (id || isCreate) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [id, isCreate])

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      replace({ id: null, create: null })
      setTimeout(() => {
        reset({ name: '', aliases: '', description: '', color: '#6366f1' })
      }, 300)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${id || 'create'}`
    navigator.clipboard.writeText(url)
    successNotification({ title: 'Link copied' })
  }

  const onSubmit = async (data: FormData) => {
    try {
      const formattedAliases = data.aliases
        ?.split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      if (isEditMode && id) {
        await updateTag({
          updateTagDefinitionId: id,
          input: {
            description: data.description,
            color: data.color,
            aliases: formattedAliases,
          },
        })
        successNotification({ title: 'Tag updated' })
      } else {
        await createTag({
          input: {
            name: data.name,
            description: data.description,
            color: data.color,
            aliases: formattedAliases,
          },
        })
        successNotification({ title: 'Tag created' })
      }
      handleOpenChange(false)
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error saving', description: parseErrorMessage(err) })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteTag({ deleteTagDefinitionId: id })
      successNotification({ title: 'Tag deleted' })
      setDeleteDialogOpen(false)
      handleOpenChange(false)
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="p-6 space-y-0 border-b">
          <div className="flex items-center justify-between">
            <PanelRightClose size={18} className="cursor-pointer" onClick={() => handleOpenChange(false)} />

            <div className="flex items-center gap-2">
              <Button icon={<LinkIcon size={14} />} variant="secondary" onClick={handleCopyLink}>
                Copy link
              </Button>

              {isEditMode && (
                <Button variant="secondary" onClick={() => setDeleteDialogOpen(true)} icon={<Trash2 size={14} />} disabled={isPending}>
                  Delete
                </Button>
              )}

              <SaveButton onClick={handleSubmit(onSubmit)} isSaving={isPending} disabled={isPending} />
            </div>
          </div>

          <div className="mt-4">
            <SheetTitle>{isCreate ? 'Create Custom Tag' : tagData?.tagDefinition?.name}</SheetTitle>
            <SheetDescription className="sr-only">Tag management form</SheetDescription>
          </div>
        </SheetHeader>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center h-64">
            <LoaderCircle className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <FormProvider {...formMethods}>
            <form className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...formMethods.register('name')} disabled={isPending || isEditMode} placeholder="e.g. High Priority" />
                {isEditMode && <p className="text-[11px] text-muted-foreground italic">Name cannot be changed after creation.</p>}
              </div>

              <div className="space-y-2">
                <Label>Aliases</Label>
                <Input {...formMethods.register('aliases')} disabled={isPending} placeholder="e.g. Critical, Urgent" />
              </div>

              <ColorInput label="Select Color" value={colorField.value} onChange={colorField.onChange} disabled={isPending} />

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...formMethods.register('description')} disabled={isPending} placeholder="Description..." />
              </div>
            </form>
          </FormProvider>
        )}

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Tag"
          description={`Are you sure you want to delete "${tagData?.tagDefinition?.name}"? This action cannot be undone.`}
          confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  )
}
