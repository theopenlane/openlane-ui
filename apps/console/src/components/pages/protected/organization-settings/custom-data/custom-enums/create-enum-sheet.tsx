'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PanelRightClose, Trash2, LoaderCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useCustomTypeEnum, useCreateCustomTypeEnum, useUpdateCustomTypeEnum, useDeleteCustomTypeEnum } from '@/lib/graphql-hooks/custom-type-enum'
import { ENUM_GROUP_MAP } from './custom-enums-config'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  objectType: z.string(),
  field: z.string().min(1, 'Field is required'),
})

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#f59e42', // Orange
  '#10b981', // Green
  '#f43f5e', // Pink
  '#3b82f6', // Blue
  '#fbbf24', // Yellow
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#a3e635', // Lime
]

const getRandomColor = () => COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]

type FormData = z.infer<typeof schema>

export const CreateEnumSheet = ({ resetPagination, filter }: { resetPagination: () => void; filter: string }) => {
  const params = useSearchParams()
  const { replace } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()

  const isCreate = params.get('create') === 'true'
  const id = params.get('id')
  const isEditMode = !!id

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const objectTypeOptions = useMemo(() => {
    const types = Object.values(ENUM_GROUP_MAP)
      .map((c) => c?.objectType)
      .filter((t): t is string => !!t)

    return Array.from(new Set(types))
  }, [])

  const { data: enumData, isLoading: isLoadingDetails } = useCustomTypeEnum(id)
  const { mutateAsync: createEnum, isPending: isCreating } = useCreateCustomTypeEnum()
  const { mutateAsync: updateEnum, isPending: isUpdating } = useUpdateCustomTypeEnum()
  const { mutateAsync: deleteEnum, isPending: isDeleting } = useDeleteCustomTypeEnum()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      color: getRandomColor(),
      objectType: '',
      field: '',
    },
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = formMethods
  const { field: colorField } = useController({ name: 'color', control })
  const { field: typeField } = useController({ name: 'objectType', control })
  const { field: fieldField } = useController({ name: 'field', control })

  const selectedObjectType = formMethods.watch('objectType')

  const isGlobal = useMemo(() => {
    const config = ENUM_GROUP_MAP[filter]
    return config?.isGlobal || false
  }, [filter])

  const selectedEnumType = useMemo(() => {
    const config = ENUM_GROUP_MAP[filter]
    const enumType = config?.field
    if (!enumType) {
      return null
    }

    return getEnumLabel(enumType)
  }, [filter])

  const fieldOptions = useMemo(() => {
    if (!selectedObjectType) return []

    const fields = Object.values(ENUM_GROUP_MAP)
      .filter((config) => config.objectType === selectedObjectType)
      .map((config) => config.field)
      .filter((f): f is string => !!f)

    return Array.from(new Set(fields))
  }, [selectedObjectType])

  useEffect(() => {
    if (fieldField.value && fieldOptions.length > 0 && !fieldOptions.includes(fieldField.value)) {
      fieldField.onChange(fieldOptions[0])
    }
  }, [selectedObjectType, fieldOptions, fieldField])

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      replace({ id: null, create: null })
      setTimeout(() => reset({ name: '', description: '', color: getRandomColor(), objectType: '', field: '' }), 300)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, objectType, field, ...input } = data
        await updateEnum({ id, input })
        successNotification({ title: 'Enum updated' })
      } else {
        await createEnum(data)
        successNotification({ title: 'Enum created' })
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
      await deleteEnum(id)
      successNotification({ title: 'Enum deleted' })
      setDeleteDialogOpen(false)
      handleOpenChange(false)
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  useEffect(() => {
    if (!id && !isCreate) {
      setOpen(false)
      return
    }

    setOpen(true)

    if (isEditMode && enumData?.customTypeEnum) {
      const { name, description, color, objectType, field } = enumData.customTypeEnum
      reset({
        name: name ?? '',
        description: description ?? '',
        color: color ?? getRandomColor(),
        objectType: objectType ?? '',
        field: field ?? '',
      })
    } else if (isCreate) {
      const activeConfig = ENUM_GROUP_MAP[filter]
      const defaultField = activeConfig?.field || (filter.includes('Kinds') ? 'kind' : filter.includes('Categories') ? 'category' : '')

      reset({
        name: '',
        description: '',
        color: getRandomColor(),
        objectType: activeConfig?.objectType || '',
        field: defaultField,
      })
    }
  }, [id, isCreate, isEditMode, enumData, filter, reset])

  const isPending = isCreating || isUpdating

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <PanelRightClose size={18} className="cursor-pointer" onClick={() => handleOpenChange(false)} />
            <div className="flex items-center gap-2">
              {isEditMode && (
                <Button variant="secondary" onClick={() => setDeleteDialogOpen(true)} icon={<Trash2 size={14} />} disabled={isPending || isDeleting}>
                  Delete
                </Button>
              )}
              <SaveButton onClick={handleSubmit(onSubmit)} isSaving={isPending} disabled={isPending} />
            </div>
          </div>
          <div className="mt-4">
            <SheetTitle>{isCreate ? `Create ${selectedEnumType || ''} Enum` : `Update ${selectedEnumType || ''} Enum`}</SheetTitle>
            <SheetDescription />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center h-64">
              <LoaderCircle className="animate-spin text-muted-foreground" size={32} />
            </div>
          ) : (
            <FormProvider {...formMethods}>
              <form key={enumData?.customTypeEnum?.id || 'create'} className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...formMethods.register('name')} disabled={isPending || isEditMode} placeholder="" />
                  {errors.name && <p className="text-destructive text-xs font-medium">{errors.name.message}</p>}
                </div>

                {!isGlobal && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Object Type</Label>
                      <Select
                        disabled={isPending || isEditMode}
                        onValueChange={(val) => {
                          if (val) typeField.onChange(val)
                        }}
                        value={typeField.value}
                      >
                        <SelectTrigger className={'capitalize '}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {objectTypeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt} className="capitalize">
                              {opt.split('_').join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.objectType && <p className="text-destructive text-xs font-medium">{errors.objectType.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        disabled={isPending || isEditMode || !selectedObjectType}
                        onValueChange={(val) => {
                          if (val) fieldField.onChange(val)
                        }}
                        value={fieldField.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedObjectType ? 'Select field' : 'Select type first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.field && <p className="text-destructive text-xs font-medium">{errors.field.message}</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <ColorInput label="Select Color" value={colorField.value} onChange={colorField.onChange} disabled={isPending} />
                  {errors.color && <p className="text-destructive text-xs font-medium">{errors.color.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...formMethods.register('description')} disabled={isPending} placeholder="Description..." className="min-h-[100px]" />
                  {errors.description && <p className="text-destructive text-xs font-medium">{errors.description.message}</p>}
                </div>
              </form>
            </FormProvider>
          )}
        </div>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Enum Value"
          description="Are you sure you want to delete this enum value? This action cannot be undone."
          confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  )
}
