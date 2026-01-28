'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useSession } from 'next-auth/react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEdit } from '@/lib/graphql-hooks/noop'
import {
  BulkEditDialogFormValues,
  BulkEditDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEdit,
  getMappedClearValue,
  InputType,
  SelectOptionBulkEdit,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { Input } from '@repo/ui/input'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEdit).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEdit),
      name: z.string(),
      placeholder: z.string(),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      inputType: z.enum([InputType.Select, InputType.Input, InputType.Date]),
    })
    .optional(),
  selectedValue: z.string().optional(),
  selectedDate: z.date().nullable().optional(),
})

const bulkEditSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({ selected, setSelected }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEdit } = useBulkEdit()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditDialogFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: defaultObject,
  })

  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })

  const membersOptions = useMemo(() => {
    if (!membersData) return []
    return membersData?.organization?.members?.edges?.map((member) => ({
      value: member?.node?.user?.id,
      label: `${member?.node?.user?.displayName}`,
    }))
  }, [membersData])

  const allOptionSelects = useMemo(() => {
    // TODO: replace with the appropriate object type and add SelectOptionBulkEdit to bulk-edit-shared-objects.tsx
    return getAllSelectOptionsForBulkEdit()
  }, [membersOptions])

  const { control, handleSubmit, watch } = form

  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some(
    (field) => (field.selectedObject && field.selectedValue) || field.selectedObject?.inputType === InputType.Input || field.selectedObject?.inputType === InputType.Date,
  )
  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 4 },
  })

  useEffect(() => {
    if (open) {
      replace([])
      append({
        value: undefined,
        selectedValue: undefined,
        selectedDate: undefined,
      })
    }
  }, [open, append, replace])

  const onSubmit = async () => {
    const ids = selected.map((object) => object.id)
    const input: Record<string, string | Date | boolean | null> = {}
    if (watchedFields.length === 0) return

    if (ids.length === 0) return
    watchedFields.forEach((field) => {
      const key = field.selectedObject?.name
      if (key && field?.selectedValue && field?.value) {
        input[key] = field.selectedValue
      }
      if (key && field?.selectedDate && field?.value) {
        input[key] = field.selectedDate
      }
      if (field.selectedObject?.inputType === InputType.Date && !field?.selectedDate) {
        const clearValue = getMappedClearValue(field.selectedObject?.name)
        input[clearValue] = true
      }
    })

    try {
      await bulkEdit({
        ids: ids,
        input,
      })
      successNotification({
        title: 'Successfully bulk updated selected assets.',
      })
      setSelected([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit asset. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selected.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selected && selected.length > 0 ? `Bulk Edit (${selected.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[580px]">
            <DialogHeader>
              <DialogTitle>Bulk edit</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              {fields.map((item, index) => {
                return (
                  <div key={item.id} className="flex items-center gap-2 w-full">
                    <div className="flex flex-col items-start gap-2">
                      <Select
                        value={watchedFields[index].value || undefined}
                        onValueChange={(value) => {
                          const selectedEnum = value as SelectOptionBulkEdit
                          update(index, {
                            value: selectedEnum,
                            selectedObject: allOptionSelects.find((item) => item.selectOptionEnum === selectedEnum),
                            selectedValue: undefined,
                            selectedDate: undefined,
                          })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOptionBulkEdit).map((option) => (
                            <SelectItem key={option} value={option} disabled={fields.some((f, i) => f.value === option && i !== index)}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.selectedObject &&
                      (item.selectedObject.inputType === InputType.Select ? (
                        <div className="flex flex-col items-center gap-2">
                          <Controller
                            name={item.selectedObject.name as keyof BulkEditDialogFormValues}
                            control={control}
                            render={() => (
                              <Select
                                value={item.selectedValue as string | undefined}
                                onValueChange={(value) =>
                                  update(index, {
                                    ...item,
                                    selectedValue: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-60">
                                  <SelectValue placeholder={item.selectedObject?.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.selectedObject?.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      ) : item.selectedObject.inputType === InputType.Date ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Controller
                            control={control}
                            name={`fieldsArray.${index}.selectedDate`}
                            render={({ field: dateField }) => (
                              <div className="w-full">
                                <CalendarPopover
                                  required={false}
                                  field={dateField}
                                  onChange={(date) => {
                                    if (date) dateField.onChange(new Date(date))
                                  }}
                                />
                              </div>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Controller
                            control={form.control}
                            name={`fieldsArray.${index}.selectedValue`}
                            render={({ field }) => <Input {...field} variant="medium" placeholder={item.selectedObject?.placeholder} className="w-full" />}
                          />
                        </div>
                      ))}
                    <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)}></Button>
                  </div>
                )
              })}
              {fields.length < Object.keys(SelectOptionBulkEdit).length ? (
                <Button
                  icon={<Plus />}
                  onClick={() =>
                    append({
                      value: undefined,
                      selectedValue: undefined,
                      selectedDate: undefined,
                    })
                  }
                  iconPosition="left"
                  variant="secondary"
                >
                  Add field
                </Button>
              ) : null}
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <SaveButton disabled={!hasFieldsToUpdate} onClick={form.handleSubmit(onSubmit)} />
              <CancelButton
                onClick={() => {
                  setOpen(false)
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
