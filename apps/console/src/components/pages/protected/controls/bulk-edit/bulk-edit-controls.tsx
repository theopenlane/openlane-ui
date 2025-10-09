'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form'
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
  getAllSelectOptionsForBulkEditControls,
  SelectOptionBulkEditControls,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { Group } from '@repo/codegen/src/schema'
import { useProgramSelect } from '@/lib/graphql-hooks/programs' // ✅ ADD THIS IMPORT

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditControls).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEditControls),
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
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>(undefined) // ✅ NEW STATE
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditDialogFormValues>({
    resolver: zodResolver(bulkEditControlsSchema),
    defaultValues: defaultObject,
  })

  const { data } = useGetAllGroups({ where: {} })
  const { programOptions } = useProgramSelect({}) // ✅ GET PROGRAMS

  const groups = useMemo(() => {
    if (!data) return
    return data?.groups?.edges?.map((edge) => edge?.node) || []
  }, [data])

  const allOptionSelects = useMemo(() => {
    if (!groups) return []
    return getAllSelectOptionsForBulkEditControls(groups.filter(Boolean) as Group[])
  }, [groups])

  const { control, handleSubmit, watch } = form
  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some((field) => field.selectedObject && field.selectedValue) || !!selectedProgram

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
      if (key && field?.selectedValue && field?.value) {
        input[key] = field.selectedValue
      }
    })

    try {
      await bulkEditControl({
        ids,
        input: {
          ...input,
          ...(selectedProgram ? { addProgramIDs: [selectedProgram] } : {}), // ✅ ADD PROGRAM
        },
      })
      successNotification({
        title: 'Successfully bulk updated selected controls.',
      })
      setIsBulkEditing(false)
      setSelectedControls([])
      setSelectedProgram(undefined)
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
                    {item.selectedObject && (
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
                    <Button icon={<Trash2 />} iconPosition="center" variant="outline" onClick={() => remove(index)} />
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Add a Program</label>
                <Select value={selectedProgram} onValueChange={(value) => setSelectedProgram(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button disabled={!hasFieldsToUpdate} type="submit" onClick={form.handleSubmit(onSubmit)}>
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setSelectedProgram(undefined)
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
