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
import { Input } from '@repo/ui/input'
import {
  BulkEditProceduresDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEditProcedures,
  getMappedClearValue,
  InputType,
  SelectOptionBulkEditProcedures,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { Group } from '@repo/codegen/src/schema'
import { useBulkEditProcedure } from '@/lib/graphql-hooks/procedures'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditProcedures).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEditProcedures),
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
  selectedDate: z.date().nullable().optional(),
})

const bulkEditProceduresSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

type BulkEditProceduresFormValues = z.infer<typeof bulkEditProceduresSchema>

export const BulkEditProceduresDialog: React.FC<BulkEditProceduresDialogProps> = ({ selectedProcedures, setSelectedProcedures }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditProcedures } = useBulkEditProcedure()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditProceduresFormValues>({
    resolver: zodResolver(bulkEditProceduresSchema),
    defaultValues: defaultObject,
  })
  const { data } = useGetAllGroups({ where: {} })
  const groups = useMemo(() => {
    if (!data) return
    return data?.groups?.edges?.map((edge) => edge?.node) || []
  }, [data])

  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'procedure',
      field: 'kind',
    },
  })

  const allOptionSelects = useMemo(() => {
    if (!groups || !isTypesSuccess) return []
    return getAllSelectOptionsForBulkEditProcedures(groups?.filter((g): g is Group => Boolean(g)) ?? [], enumOptions)
  }, [groups, isTypesSuccess, enumOptions])

  const { control, handleSubmit, watch } = form

  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some((field) => (field.selectedObject && field.selectedValue) || field.selectedObject?.inputType === InputType.Input)

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 4 },
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
    const ids = selectedProcedures.map((procedure) => procedure.id)
    const input: Record<string, string | boolean> = {}
    if (watchedFields.length === 0) return

    if (ids.length === 0) return
    watchedFields.forEach((field) => {
      const key = field.selectedObject?.name
      if (!key) return

      if (field?.selectedValue && field?.value) {
        input[key] = field.selectedValue
      }

      if (field.selectedObject?.inputType === InputType.Input && !field?.selectedValue) {
        const clearValue = getMappedClearValue(field.selectedObject?.name)
        input[clearValue] = true
      }
    })

    try {
      await bulkEditProcedures({
        ids: ids,
        input,
      })
      successNotification({
        title: 'Successfully bulk updated selected procedures.',
      })
      setSelectedProcedures([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit procedure. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedProcedures.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedProcedures && selectedProcedures.length > 0 ? `Bulk Edit (${selectedProcedures.length})` : 'Bulk Edit'}
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
                          const selectedOption = allOptionSelects.find((item) => item.selectOptionEnum === value)
                          if (!selectedOption) return
                          update(index, { value: selectedOption.selectOptionEnum, selectedObject: selectedOption, selectedValue: undefined })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOptionBulkEditProcedures).map((option) => (
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
                          <Select
                            value={item.selectedValue}
                            onValueChange={(value) =>
                              update(index, {
                                ...item,
                                selectedValue: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-60">
                              <SelectValue placeholder={item.selectedObject?.placeholder}>
                                <CustomTypeEnumValue value={item.selectedValue} options={item.selectedObject?.options || []} placeholder={item.selectedObject?.placeholder ?? ''} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(item.selectedObject?.options || []).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <CustomTypeEnumOptionChip option={option} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
              {fields.length < 4 ? (
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
