'use client'

import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ClientError } from 'graphql-request'
import { useBulkUpdateTrustCenterDocs } from '@/lib/graphql-hooks/trust-center'
import { TrustCenterDocTrustCenterDocumentVisibility } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

export enum SelectOptionBulkEditTrustCenterDocs {
  CATEGORY = 'Category',
  VISIBILITY = 'Visibility',
}

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditTrustCenterDocs).optional(),
  selectedValue: z.string().optional(),
  visibilityEnum: z.nativeEnum(TrustCenterDocTrustCenterDocumentVisibility).optional(),
})

const bulkEditDocsSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

type BulkEditDialogFormValues = z.infer<typeof bulkEditDocsSchema>

type Props = {
  selectedDocs: { id: string }[]
  setSelectedDocs: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const BulkEditTrustCenterDocsDialog: React.FC<Props> = ({ selectedDocs, setSelectedDocs }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditDocs } = useBulkUpdateTrustCenterDocs()
  const { successNotification, errorNotification } = useNotification()
  const { enumOptions: categoryOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'trustcenterdoc',
      field: 'kind',
    },
  })

  const form = useForm<BulkEditDialogFormValues>({
    resolver: zodResolver(bulkEditDocsSchema),
    defaultValues: { fieldsArray: [] },
  })

  const { control, handleSubmit } = form
  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 4 },
  })

  const watchedFields = useWatch({ control, name: 'fieldsArray' }) ?? []
  const hasFieldsToUpdate = watchedFields.some(
    (field) => (field.value === SelectOptionBulkEditTrustCenterDocs.CATEGORY && field.selectedValue) || (field.value === SelectOptionBulkEditTrustCenterDocs.VISIBILITY && field.visibilityEnum),
  )

  useEffect(() => {
    if (open && fields.length === 0) {
      append({ value: undefined })
    }
  }, [open, append, fields.length])

  const onSubmit = async () => {
    const ids = selectedDocs.map((doc) => doc.id)
    if (!ids.length) return

    const input: Record<string, string> = {}
    watchedFields.forEach((field) => {
      if (field.value === SelectOptionBulkEditTrustCenterDocs.CATEGORY && field.selectedValue) {
        input.trustCenterDocKindName = field.selectedValue
      }
      if (field.value === SelectOptionBulkEditTrustCenterDocs.VISIBILITY && field.visibilityEnum) {
        input.visibility = field.visibilityEnum
      }
    })

    try {
      await bulkEditDocs({ ids, input })
      successNotification({ title: 'Successfully updated selected documents.' })
      setSelectedDocs([])
      setOpen(false)
      replace([])
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit documents. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedDocs.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedDocs?.length ? `Bulk Edit (${selectedDocs.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[580px]">
            <DialogHeader>
              <DialogTitle>Bulk Edit Documents</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-4">
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2">
                  {/* Field Selector */}
                  <Select
                    value={watchedFields[index]?.value || undefined}
                    onValueChange={(value) => {
                      const enumValue = Object.values(SelectOptionBulkEditTrustCenterDocs).find((opt) => opt === value)
                      if (!enumValue) return
                      update(index, {
                        value: enumValue,
                        selectedValue: undefined,
                        visibilityEnum: undefined,
                      })
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SelectOptionBulkEditTrustCenterDocs).map((option) => (
                        <SelectItem key={option} value={option} disabled={fields.some((f, i) => f.value === option && i !== index)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value Input */}
                  {watchedFields[index]?.value === SelectOptionBulkEditTrustCenterDocs.CATEGORY && (
                    <Controller
                      control={control}
                      name={`fieldsArray.${index}.selectedValue`}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger className="w-60">
                            <SelectValue placeholder="Select category">
                              <CustomTypeEnumValue value={field.value} options={categoryOptions} placeholder="Select category" />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <CustomTypeEnumOptionChip option={option} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  {watchedFields[index]?.value === SelectOptionBulkEditTrustCenterDocs.VISIBILITY && (
                    <Controller
                      control={control}
                      name={`fieldsArray.${index}.visibilityEnum`}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={(val) => {
                            const visibility = Object.values(TrustCenterDocTrustCenterDocumentVisibility).find((v) => v === val)
                            if (visibility) field.onChange(visibility)
                          }}
                        >
                          <SelectTrigger className="w-60">
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TrustCenterDocTrustCenterDocumentVisibility.PUBLICLY_VISIBLE}>Publicly Visible</SelectItem>
                            <SelectItem value={TrustCenterDocTrustCenterDocumentVisibility.PROTECTED}>Protected</SelectItem>
                            <SelectItem value={TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE}>Not Visible</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}

                  <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)} />
                </div>
              ))}

              {/* Add New Field Button */}
              {fields.length < Object.keys(SelectOptionBulkEditTrustCenterDocs).length && (
                <Button icon={<Plus />} onClick={() => append({ value: undefined })} iconPosition="left" variant="secondary">
                  Add Field
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
