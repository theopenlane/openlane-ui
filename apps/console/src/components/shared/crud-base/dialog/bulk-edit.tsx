'use client'

import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { ObjectNames } from '@repo/codegen/src/type-names'

export enum InputType {
  Select = 'select',
  Input = 'input',
  Date = 'date',
}

export interface BulkEditFieldOption {
  label: string
  value: string
}

export interface BulkEditFieldConfig {
  key: string
  label: string
  name: string
  placeholder: string
  inputType: InputType
  options?: BulkEditFieldOption[]
  clearValueKey?: string
}

interface GenericBulkEditDialogProps<T extends { id: string }> {
  selectedItems: T[]
  setSelectedItems: React.Dispatch<React.SetStateAction<T[]>>
  fieldConfigs: BulkEditFieldConfig[]
  bulkEditMutation: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutateAsync: (params: { ids: string[]; input: Record<string, any> }) => Promise<any>
  }
  entityLabel: ObjectNames
}

const fieldItemSchema = z.object({
  fieldKey: z.string().optional(),
  selectedConfig: z.any().optional(),
  selectedValue: z.string().optional(),
  selectedDate: z.date().nullable().optional(),
})

const bulkEditSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

interface BulkEditFormValues {
  fieldsArray: Array<{
    fieldKey?: string
    selectedConfig?: BulkEditFieldConfig
    selectedValue?: string
    selectedDate?: Date | null
  }>
}

export function GenericBulkEditDialog<T extends { id: string }>({ selectedItems, setSelectedItems, fieldConfigs, bulkEditMutation, entityLabel }: GenericBulkEditDialogProps<T>) {
  const [open, setOpen] = useState(false)
  const { errorNotification, successNotification } = useNotification()

  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      fieldsArray: [],
    },
  })

  const { control, handleSubmit, watch } = form

  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some(
    (field) => (field.selectedConfig && field.selectedValue) || field.selectedConfig?.inputType === InputType.Input || field.selectedConfig?.inputType === InputType.Date,
  )

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: fieldConfigs.length },
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
    const input: Record<string, string | Date | boolean | null> = {}

    if (watchedFields.length === 0 || ids.length === 0) return

    watchedFields.forEach((field) => {
      const key = field.selectedConfig?.name

      if (key && field?.selectedValue && field?.fieldKey) {
        input[key] = field.selectedValue
      }
      if (key && field?.selectedDate && field?.fieldKey) {
        input[key] = field.selectedDate
      }
      if (field.selectedConfig?.inputType === InputType.Date && !field?.selectedDate && field.selectedConfig?.clearValueKey) {
        input[field.selectedConfig.clearValueKey] = true
      }
    })

    try {
      await bulkEditMutation.mutateAsync({ ids, input })
      successNotification({
        title: `Successfully bulk updated selected ${entityLabel.toLowerCase()}.`,
      })
      setSelectedItems([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? `Failed to bulk edit ${entityLabel.toLowerCase()}. Please try again.`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedItems.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedItems.length > 0 ? `Bulk Edit (${selectedItems.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[580px]">
            <DialogHeader>
              <DialogTitle>Bulk edit {entityLabel.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 w-full">
                  <div className="flex flex-col items-start gap-2">
                    <Select
                      value={watchedFields[index]?.fieldKey || undefined}
                      onValueChange={(value) => {
                        const selectedConfig = fieldConfigs.find((config) => config.key === value)
                        update(index, {
                          fieldKey: value,
                          selectedConfig,
                          selectedValue: undefined,
                          selectedDate: undefined,
                        })
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldConfigs.map((config) => (
                          <SelectItem key={config.key} value={config.key} disabled={fields.some((f, i) => watchedFields[i]?.fieldKey === config.key && i !== index)}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {item.selectedConfig &&
                    (item.selectedConfig.inputType === InputType.Select ? (
                      <div className="flex flex-col items-center gap-2">
                        <Controller
                          name={`fieldsArray.${index}.selectedValue`}
                          control={control}
                          render={() => (
                            <Select
                              value={watchedFields[index]?.selectedValue as string | undefined}
                              onValueChange={(value) =>
                                update(index, {
                                  ...watchedFields[index],
                                  selectedValue: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-60">
                                <SelectValue placeholder={item.selectedConfig?.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {item.selectedConfig?.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    ) : item.selectedConfig.inputType === InputType.Date ? (
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
                          render={({ field }) => <Input {...field} variant="medium" placeholder={item.selectedConfig?.placeholder} className="w-full" />}
                        />
                      </div>
                    ))}
                  <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)}></Button>
                </div>
              ))}
              {fields.length < fieldConfigs.length && (
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
