'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray, Path } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEditControl } from '@/lib/graphql-hooks/controls'
import {
  BulkEditDialogFormValues,
  BulkEditControlsDialogProps,
  defaultObject,
  SelectOptionBulkEditControls,
  useGetAllSelectOptionsForBulkEditControls,
  InputType,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { Group } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { controlIconsMap, EditableSelectFromQuery } from '../properties-card'

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditControls).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEditControls),
      name: z.string(),
      placeholder: z.string(),
      inputType: z.nativeEnum(InputType),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  selectedValue: z.string().optional(),
})
const bulkEditControlsSchema = z.object({
  fieldsArray: z.array(fieldItemSchema).optional().default([]),
})

export const BulkEditControlsDialog: React.FC<BulkEditControlsDialogProps> = ({ selectedControls, setSelectedControls }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditDialogFormValues>({
    resolver: zodResolver(bulkEditControlsSchema),
    defaultValues: defaultObject,
  })

  const { data } = useGetAllGroups({ where: {} })

  const groups = useMemo(() => {
    if (!data) return
    return data?.groups?.edges?.map((edge) => edge?.node) || []
  }, [data])

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'control',
      field: 'kind',
    },
  })

  const allOptionSelects = useGetAllSelectOptionsForBulkEditControls((groups?.filter(Boolean) as Group[]) || [], enumOptions)

  const { control, handleSubmit, watch } = form
  const watchedFields = watch('fieldsArray') || []

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 3 },
  })

  useEffect(() => {
    if (open) {
      append({
        value: undefined,
        selectedValue: undefined,
      })
    }
  }, [open, append])

  const onSubmit = async () => {
    const ids = selectedControls.map((control) => control.id)
    const input: Record<string, string> = {}
    if (watchedFields.length === 0) return
    if (ids.length === 0) return

    watchedFields.forEach((field) => {
      const key = field.selectedObject?.name
      if (!key) return
      if (key && field?.selectedValue && field?.value) {
        input[key] = field.selectedValue
        return
      }
      const value = form.getValues(key as Path<BulkEditDialogFormValues>)
      if (typeof value === 'string' && value.trim() !== '') {
        input[key] = value
        return
      }
    })

    try {
      await bulkEditControl({
        ids,
        input: {
          ...input,
        },
      })
      successNotification({
        title: 'Successfully bulk updated selected controls.',
      })
      setSelectedControls([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit control. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedControls.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedControls && selectedControls.length > 0 ? `Bulk Edit (${selectedControls.length})` : 'Bulk Edit'}
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
                  <div key={item.id} className="flex justify-items items-start gap-2">
                    <div className="flex flex-col items-start gap-2">
                      <Select
                        value={watchedFields[index].value || undefined}
                        onValueChange={(value) => {
                          const selectedEnum = value as SelectOptionBulkEditControls
                          update(index, { value: selectedEnum, selectedObject: allOptionSelects.find((item) => item.selectOptionEnum === selectedEnum), selectedValue: undefined })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOptionBulkEditControls).map((option) => (
                            <SelectItem key={option} value={option} disabled={fields.some((f, i) => f.value === option && i !== index)}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.selectedObject && item.selectedObject.inputType === InputType.Select && (
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
                    )}
                    {(() => {
                      const selectedObject = item.selectedObject
                      if (!selectedObject || selectedObject.inputType !== InputType.TypeAhead) return null

                      return (
                        <div className="flex flex-col items-center gap-2">
                          <EditableSelectFromQuery
                            iconAndLabelVisible={false}
                            label={selectedObject.selectOptionEnum}
                            name={selectedObject.name}
                            isEditAllowed
                            isEditing
                            hasGap={false}
                            gridColWidth="240"
                            icon={selectedObject.selectOptionEnum === SelectOptionBulkEditControls.Category ? controlIconsMap.Category : controlIconsMap.SubCategory}
                          />
                        </div>
                      )
                    })()}
                    <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)} />
                  </div>
                )
              })}

              {fields.length < 5 ? (
                <Button
                  icon={<Plus />}
                  onClick={() =>
                    append({
                      value: undefined,
                      selectedValue: undefined,
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
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpen(false)
                  replace([])
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </FormProvider>
    </Dialog>
  )
}
