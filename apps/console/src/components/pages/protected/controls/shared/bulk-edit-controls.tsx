'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ControlStatusOptions, ControlControlTypeOptions } from '@/components/shared/enum-mapper/control-enum'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Option } from '@repo/ui/multiple-selector'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEditControl } from '@/lib/graphql-hooks/controls'

type BulkEditControlsDialogProps = {
  selectedControls: { id: string; refCode: string }[]
  setIsBulkEditing: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
}

interface BulkEditControlDialogFormValues {
  fieldsArray: FieldItem[]
}

interface SelectOptionSelectedObject {
  selectOptionEnum: SelectOption
  selectName: string
  name: string
  placeholder: string
  options: Option[]
}

enum SelectOption {
  Status = 'STATUS',
  ControlType = 'CONTROL_TYPE',
  ControlOwner = 'CONTROL_OWNER',
}

interface FieldItem {
  value: SelectOption | undefined
  selectedObject?: SelectOptionSelectedObject
  selectedValue: string | undefined
}

const defaultObject = {
  fieldsArray: [],
}

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOption).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOption),
      selectName: z.string(),
      name: z.string(),
      placeholder: z.string(),
      selectedValue: z.string().optional(),
      options: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      ),
    })
    .optional(),
})

const bulkEditControlsSchema = z.object({
  fieldsArray: z.array(fieldItemSchema).optional().default([]),
})

export const BulkEditControlsDialog: React.FC<BulkEditControlsDialogProps> = ({ selectedControls, setIsBulkEditing, setSelectedControls }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditControlDialogFormValues>({
    resolver: zodResolver(bulkEditControlsSchema),
    defaultValues: defaultObject,
  })
  const { data } = useGetAllGroups({ where: {} })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const allOptionSelects: SelectOptionSelectedObject[] = [
    {
      selectOptionEnum: SelectOption.ControlOwner,
      selectName: 'groupSelect',
      name: 'controlOwnerID',
      placeholder: 'Select control owner',
      options: groups.map((g) => ({ label: g?.name || '', value: g?.id || '' })),
    },
    {
      selectOptionEnum: SelectOption.Status,
      selectName: 'statusSelect',
      name: 'status',
      placeholder: 'Select a status',
      options: ControlStatusOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
    {
      selectOptionEnum: SelectOption.ControlType,
      selectName: 'controlTypeSelect',
      name: 'controlType',
      placeholder: 'Select a control type',
      options: ControlControlTypeOptions.map((g) => ({ label: g?.label || '', value: g?.value || '' })),
    },
  ]

  const { control, handleSubmit, watch } = form

  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some((field) => field.selectedObject && field.selectedValue)
  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 3 },
  })

  const onSubmit = async () => {
    const ids = selectedControls.map((control) => control.id)
    const input: Record<string, string> = {}
    if (watchedFields.length === 0) return

    if (ids.length === 0) return
    watchedFields.forEach((field) => {
      const key = field.selectedObject?.name
      if (key && field?.selectedValue && field?.value) {
        input[key] = field.selectedValue
      }
    })

    try {
      await bulkEditControl({
        ids: ids,
        input,
      })
      successNotification({
        title: 'Successfully bulk updated selected controls.',
      })
      setIsBulkEditing(false)
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
          <Button disabled={selectedControls.length === 0} icon={<Pencil />} iconPosition="left" variant="outline">
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
                  <div key={item.id} className="flex justify-items items-flex-start gap-2">
                    <div className="flex flex-col justify-items items-baseline gap-2">
                      <Select
                        value={watchedFields[index].value || undefined}
                        onValueChange={(value) => {
                          const selectedEnum = value as SelectOption
                          update(index, { value: selectedEnum, selectedObject: allOptionSelects.find((item) => item.selectOptionEnum === selectedEnum), selectedValue: undefined })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select a field to update" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOption).map((option) => (
                            <SelectItem key={option} value={option} disabled={fields.some((f, i) => f.value === option && i !== index)}>
                              {option === SelectOption.Status ? 'Status' : option === SelectOption.ControlOwner ? 'Control owner' : 'Control type'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.selectedObject && (
                      <div className="flex flex-col justify-items items-center gap-2">
                        <Controller
                          name={item.selectedObject.name as keyof BulkEditControlDialogFormValues}
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
                                {item.selectedObject?.options.map((option) => (
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
                    <Button icon={<Trash2 />} iconPosition="center" variant="outline" onClick={() => remove(index)}></Button>
                  </div>
                )
              })}
              {fields.length < 3 ? (
                <Button
                  icon={<Plus />}
                  onClick={() =>
                    append({
                      value: undefined,
                      selectedValue: undefined,
                    })
                  }
                  iconPosition="left"
                  variant="outline"
                >
                  Add field
                </Button>
              ) : null}
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <Button disabled={!hasFieldsToUpdate} type="submit" onClick={form.handleSubmit(onSubmit)}>
                Save
              </Button>
              <Button
                variant="outline"
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
