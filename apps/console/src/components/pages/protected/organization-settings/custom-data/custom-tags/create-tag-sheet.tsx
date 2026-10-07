'use client'

import { type UpdateTagDefinitionInput } from '@repo/codegen/src/schema'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { omit, orClear, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoaderCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useCreateTag, useUpdateTag, useGetTagDetails } from '@/lib/graphql-hooks/tag-definition'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useSession } from 'next-auth/react'

const TAG_FORM_ID = 'tagForm'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  aliases: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
})

type FormData = z.infer<typeof schema>

const DEFAULT_TAG_COLOR = '#6366f1'

const BLANK_TAG_FORM: FormData = { name: '', aliases: '', description: '', color: DEFAULT_TAG_COLOR }

const parseAliases = (aliases: string | undefined) =>
  aliases
    ?.split(',')
    .map((alias) => alias.trim())
    .filter(Boolean) ?? []

const TAG_UPDATE_FIELDS = {
  name: omit,
  description: orClear('clearDescription'),
  color: orClear('clearColor'),
  aliases: (value) => {
    const aliases = parseAliases(value)
    return aliases.length > 0 ? { aliases } : { clearAliases: true }
  },
} satisfies TFieldMappers<FormData, UpdateTagDefinitionInput>

export const CreateTagSheet = ({ resetPagination }: { resetPagination: () => void }) => {
  const params = useSearchParams()
  const { replace } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canEditTags = canEdit(permission?.roles, session)

  const isCreate = params.get('create') === 'true'
  const id = params.get('id')
  const isEditMode = !!id

  const [open, setOpen] = useState(false)

  const { data: tagData, isLoading: isLoadingDetails, isPlaceholderData } = useGetTagDetails(id)
  const { mutateAsync: createTag, isPending: isCreating } = useCreateTag()
  const { mutateAsync: updateTag, isPending: isUpdating } = useUpdateTag()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: BLANK_TAG_FORM,
  })

  const { control, handleSubmit, reset } = formMethods
  const buildDirtyInput = useDirtyInput(formMethods)
  const { field: colorField } = useController({ name: 'color', control })

  useEffect(() => {
    if (!open) return
    if (!id) {
      if (isCreate) reset(BLANK_TAG_FORM)
      return
    }
    const t = tagData?.tagDefinition
    if (!t || t.id !== id || isPlaceholderData) return
    reset({
      name: t.name ?? '',
      aliases: Array.isArray(t.aliases) ? t.aliases.join(', ') : (t.aliases ?? ''),
      description: t.description ?? '',
      color: normalizeHexColor(t.color) ?? DEFAULT_TAG_COLOR,
    })
  }, [open, id, isCreate, tagData, isPlaceholderData, reset])

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
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && id) {
        const input = await buildDirtyInput<UpdateTagDefinitionInput>(data, TAG_UPDATE_FIELDS)

        if (Object.keys(input).length > 0) {
          await updateTag({ updateTagDefinitionId: id, input })
          successNotification({ title: 'Tag updated' })
        }
      } else {
        await createTag({
          input: {
            name: data.name,
            description: data.description,
            color: data.color,
            aliases: parseAliases(data.aliases),
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

  const isPending = isCreating || isUpdating
  const isLoadingTag = isLoadingDetails || (isEditMode && isPlaceholderData)

  const tagHeading = isCreate ? 'Create Custom Tag' : (tagData?.tagDefinition?.name ?? 'Custom Tag')

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        side="right"
        className="w-[420px] sm:w-[480px]"
        header={
          <SlideoutHeader
            title={tagHeading}
            onClose={() => handleOpenChange(false)}
            formActions={
              canEditTags && !isLoadingTag ? (
                <SlideoutFormActions
                  formId={TAG_FORM_ID}
                  onCancel={() => handleOpenChange(false)}
                  isPending={isPending}
                  saveLabel={isCreate ? 'Create' : 'Save'}
                  savingLabel={isCreate ? 'Creating...' : 'Saving...'}
                />
              ) : undefined
            }
          />
        }
      >
        {isLoadingTag ? (
          <div className="flex items-center justify-center h-64">
            <LoaderCircle className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <FormProvider {...formMethods}>
            <form id={TAG_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...formMethods.register('name')} disabled={isPending || isEditMode || !canEditTags} placeholder="e.g. High Priority" />
                {isEditMode && <p className="text-[11px] text-muted-foreground italic">Name cannot be changed after creation.</p>}
              </div>

              <div className="space-y-2">
                <Label>Aliases</Label>
                <Input {...formMethods.register('aliases')} disabled={isPending || !canEditTags} placeholder="e.g. Critical, Urgent" />
              </div>

              <ColorInput label="Select Color" value={colorField.value} onChange={colorField.onChange} disabled={isPending || !canEditTags} />

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...formMethods.register('description')} disabled={isPending || !canEditTags} placeholder="Description..." />
              </div>
            </form>
          </FormProvider>
        )}
      </SheetContent>
    </Sheet>
  )
}
