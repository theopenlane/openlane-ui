'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { Input } from '@repo/ui/input'
import {
  BulkEditDialogFormValues,
  BulkEditRisksDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEditRisks,
  getMappedClearValue,
  InputType,
  SelectOptionBulkEditRisks,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { Group } from '@repo/codegen/src/schema'
import { useBulkEditRisk } from '@/lib/graphql-hooks/risk'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditRisks).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEditRisks),
      name: z.string(),
      placeholder: z.string(),
      selectedValue: z.string().optional(),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      inputValue: z.string().optional(),
    })
    .optional(),
})

const bulkEditRisksSchema = z.object({
  fieldsArray: z.array(fieldItemSchema).optional().default([]),
})

export const BulkEditRisksDialog: React.FC<BulkEditRisksDialogProps> = ({ selectedRisks, setSelectedRisks }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditRisks } = useBulkEditRisk()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditDialogFormValues>({
    resolver: zodResolver(bulkEditRisksSchema),
    defaultValues: defaultObject,
  })
  const { data } = useGetAllGroups({ where: {} })
  const groups = useMemo(() => {
    if (!data) return
    return data?.groups?.edges?.map((edge) => edge?.node) || []
  }, [data])

  const { enumOptions: typeOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'kind',
    },
  })

  const { enumOptions: categoryOptions, isSuccess: isCategoriesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'category',
    },
  })

  const allOptionSelects = useMemo(() => {
    if (!groups || !isTypesSuccess || !isCategoriesSuccess) return []
    return getAllSelectOptionsForBulkEditRisks(groups?.filter(Boolean) as Group[], typeOptions, categoryOptions)
  }, [groups, typeOptions, categoryOptions, isCategoriesSuccess, isTypesSuccess])

  const { control, handleSubmit, watch } = form

  const watchedFields = watch('fieldsArray') || []
  const hasFieldsToUpdate = watchedFields.some((field) => (field.selectedObject && field.selectedValue) || field.selectedObject?.inputType === InputType.Input)

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 7 },
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
    const ids = selectedRisks.map((risk) => risk.id)
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
      await bulkEditRisks({
        ids: ids,
        input,
      })
      successNotification({
        title: 'Successfully bulk updated selected risks.',
      })
      setSelectedRisks([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit risk. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedRisks.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedRisks && selectedRisks.length > 0 ? `Bulk Edit (${selectedRisks.length})` : 'Bulk Edit'}
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
                          const selectedEnum = value as SelectOptionBulkEditRisks
                          update(index, { value: selectedEnum, selectedObject: allOptionSelects.find((item) => item.selectOptionEnum === selectedEnum), selectedValue: undefined })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOptionBulkEditRisks).map((option) => (
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
                            render={({ field }) => (
                              <Select
                                value={item.selectedValue as string | undefined}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  update(index, {
                                    ...item,
                                    selectedValue: value,
                                  })
                                }}
                              >
                                <SelectTrigger className="w-60">
                                  <SelectValue>
                                    <CustomTypeEnumValue
                                      value={item.selectedValue as string | undefined}
                                      options={item.selectedObject?.options || []}
                                      placeholder={item.selectedObject?.placeholder ?? ''}
                                    />
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
              {fields.length < Object.keys(SelectOptionBulkEditRisks).length ? (
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
