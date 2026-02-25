'use client'

import React, { useEffect, useState } from 'react'
import { z, ZodObject, ZodRawShape } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWatch } from 'react-hook-form'
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { Input } from '@repo/ui/input'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { EnumOptionsGeneric } from '../page'
import { toHumanLabel } from '@/utils/strings'

export interface BulkEditFieldOption {
  label: string
  value: string
}

interface GenericBulkEditDialogProps<T extends { id: string }, TUpdateInput> {
  selectedItems: T[]
  setSelectedItems: React.Dispatch<React.SetStateAction<T[]>>
  schema: ZodObject<ZodRawShape>
  bulkEditMutation: {
    mutateAsync: (params: { ids: string[]; input: TUpdateInput }) => Promise<void>
  }
  entityType?: ObjectTypes
  open?: boolean
  onOpenChange?: (open: boolean) => void
  enumOpts?: EnumOptionsGeneric
}

const fieldItemSchema = z.object({
  fieldKey: z.string().optional(),
  selectedConfig: z.any().optional(),
  selectedValue: z.union([z.string(), z.boolean()]).optional(),
  selectedDate: z.date().nullable().optional(),
})

const bulkEditSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

interface BulkEditFormValues {
  fieldsArray: Array<{
    fieldKey?: string
    selectedValue?: string | boolean
    selectedDate?: Date | null
  }>
}

const getEnumKey = (fieldKey: string) => `${fieldKey.replace(/Name$/, '')}Options`

export function GenericBulkEditDialog<T extends { id: string }, TUpdateInput>({
  selectedItems,
  setSelectedItems,
  schema,
  bulkEditMutation,
  entityType,
  open: openProp,
  onOpenChange,
  enumOpts,
}: GenericBulkEditDialogProps<T, TUpdateInput>) {
  const [open, setOpen] = useState(openProp ?? false)
  const { errorNotification, successNotification } = useNotification()

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      fieldsArray: [],
    },
  })

  const fieldShape = schema.shape
  const fieldKeys = Object.keys(fieldShape)

  const { control, handleSubmit } = form

  const watchedFields = useWatch({ control, name: 'fieldsArray' }) || []
  const hasFieldsToUpdate = watchedFields.some(
    (field) => field.fieldKey && ((field.selectedValue !== undefined && field.selectedValue !== '') || (field.selectedDate !== undefined && field.selectedDate !== null)),
  )

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: fieldKeys.length },
  })

  useEffect(() => {
    if (open) {
      replace([])
      append({
        fieldKey: undefined,
        selectedValue: undefined,
        selectedDate: undefined,
      })
    }
  }, [open, append, replace])

  const onSubmit = async () => {
    const ids = selectedItems.map((item) => item.id)
    const input: TUpdateInput = {} as TUpdateInput

    if (watchedFields.length === 0 || ids.length === 0) return

    watchedFields.forEach((field) => {
      const key = field.fieldKey
      if (key && field.selectedValue !== undefined && field.selectedValue !== '') {
        input[key as keyof TUpdateInput] = field.selectedValue as TUpdateInput[keyof TUpdateInput]
      }
      if (key && field.selectedDate) {
        input[key as keyof TUpdateInput] = field.selectedDate as TUpdateInput[keyof TUpdateInput]
      }
    })

    try {
      await bulkEditMutation.mutateAsync({ ids, input })
      successNotification({
        title: `Successfully bulk updated selected ${toHumanLabel(entityType as string)?.toLowerCase()}.`,
      })
      setSelectedItems([])
      handleOpenChange(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? `Failed to bulk edit ${toHumanLabel(entityType as string)?.toLowerCase()}. Please try again.`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedItems.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedItems.length > 0 ? `Bulk Edit (${selectedItems.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[580px]">
            <DialogHeader>
              <DialogTitle>Bulk edit {toHumanLabel(entityType as string)?.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              {fields.map((item, index) => {
                const fieldKey = watchedFields[index]?.fieldKey
                const zodType = fieldKey ? fieldShape[fieldKey] : undefined

                const enumKey = fieldKey ? getEnumKey(fieldKey) : undefined
                const selectOptions = enumOpts && enumKey ? enumOpts[enumKey] : undefined

                const getInnerZodType = (zodType: z.ZodTypeAny): z.ZodTypeAny => {
                  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
                    return getInnerZodType(zodType._def.innerType)
                  }
                  return zodType
                }
                const innerZodType = zodType ? getInnerZodType(zodType) : undefined

                return (
                  <div key={item.id} className="flex items-center gap-2 w-full">
                    <div className="flex flex-col items-start gap-2">
                      <Select
                        value={fieldKey || undefined}
                        onValueChange={(value) => {
                          update(index, {
                            fieldKey: value,
                            selectedValue: undefined,
                            selectedDate: undefined,
                          })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldKeys.map((key) => (
                            <SelectItem key={key} value={key} disabled={fields.some((f, i) => watchedFields[i]?.fieldKey === key && i !== index)}>
                              {toHumanLabel(key)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectOptions ? (
                      <Controller
                        control={control}
                        name={`fieldsArray.${index}.selectedValue`}
                        render={({ field }) => (
                          <Select value={field.value === undefined ? undefined : String(field.value)} onValueChange={field.onChange}>
                            <SelectTrigger className="w-60">
                              <SelectValue placeholder={selectOptions[0]?.label} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectOptions.map((option) => (
                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                  {String(option.label)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : innerZodType instanceof z.ZodDate ? (
                      // Render date picker
                      <Controller
                        control={control}
                        name={`fieldsArray.${index}.selectedDate`}
                        render={({ field }) => (
                          <CalendarPopover
                            required={false}
                            field={field}
                            onChange={(date) => {
                              if (date) field.onChange(new Date(date))
                            }}
                          />
                        )}
                      />
                    ) : innerZodType instanceof z.ZodBoolean ? (
                      // Render boolean select
                      <Controller
                        control={control}
                        name={`fieldsArray.${index}.selectedValue`}
                        render={({ field }) => (
                          <Select value={field.value === undefined ? undefined : String(field.value)} onValueChange={(val) => field.onChange(val === 'true')}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Select value..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      // Fallback to text input
                      <Controller
                        control={control}
                        name={`fieldsArray.${index}.selectedValue`}
                        render={({ field }) => (
                          <Input {...field} variant="medium" placeholder={toHumanLabel(fieldKey || '')} className="w-full" value={field.value === undefined ? '' : String(field.value)} />
                        )}
                      />
                    )}
                    <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)}></Button>
                  </div>
                )
              })}
              {fields.length < fieldKeys.length && (
                <Button
                  icon={<Plus />}
                  onClick={() =>
                    append({
                      fieldKey: undefined,
                      selectedValue: undefined,
                      selectedDate: undefined,
                    })
                  }
                  iconPosition="left"
                  variant="secondary"
                >
                  Add field
                </Button>
              )}
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <SaveButton disabled={!hasFieldsToUpdate} onClick={form.handleSubmit(onSubmit)} />
              <CancelButton
                onClick={() => {
                  handleOpenChange(false)
                  replace([])
                }}
              ></CancelButton>
            </DialogFooter>
          </DialogContent>
        </form>
      </FormProvider>
    </Dialog>
  )
}
