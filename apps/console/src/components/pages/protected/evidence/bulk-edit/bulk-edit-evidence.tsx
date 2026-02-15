'use client'
import {
  BulkEditEvidenceDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEditEvidence,
  getMappedClearValue,
  InputType,
  SelectOptionBulkEditEvidence,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { useBulkEditEvidence } from '@/lib/graphql-hooks/evidence'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { ClientError } from 'graphql-request'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const fieldItemSchema = z.object({
  value: z.nativeEnum(SelectOptionBulkEditEvidence).optional(),
  selectedObject: z
    .object({
      selectOptionEnum: z.nativeEnum(SelectOptionBulkEditEvidence),
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
  selectedValue: z.union([z.string(), z.array(z.string())]).optional(),
  selectedDate: z.date().nullable().optional(),
})

const bulkEditEvidenceSchema = z.object({
  fieldsArray: z.array(fieldItemSchema),
})

type BulkEditEvidenceFormValues = z.infer<typeof bulkEditEvidenceSchema>

export const BulkEditEvidenceDialog: React.FC<BulkEditEvidenceDialogProps> = ({ selectedEvidence, setSelectedEvidence }: BulkEditEvidenceDialogProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditEvidence } = useBulkEditEvidence()
  const { errorNotification, successNotification } = useNotification()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { tagOptions } = useGetTags()

  const form = useForm<BulkEditEvidenceFormValues>({
    resolver: zodResolver(bulkEditEvidenceSchema),
    defaultValues: defaultObject,
  })
  const { control, handleSubmit } = form
  const watchedFields = useWatch({ control, name: 'fieldsArray' }) ?? []
  const hasFieldsToUpdate = watchedFields.some((field) => (field.selectedObject && field.selectedValue) || field.selectedObject?.inputType === InputType.Input)
  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: 4 },
  })

  const allOptionSelects = useMemo(() => {
    return getAllSelectOptionsForBulkEditEvidence()
  }, [])

  const onSubmit = async () => {
    const ids = selectedEvidence.map((evidence) => evidence.id)
    const input: Record<string, string | string[] | boolean> = {}
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
      await bulkEditEvidence({
        ids: ids,
        input,
      })
      successNotification({
        title: 'Successfully bulk updated selected evidence.',
      })
      setSelectedEvidence([])
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit evidence. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedEvidence.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedEvidence && selectedEvidence.length > 0 ? `Bulk Edit (${selectedEvidence.length})` : 'Bulk Edit'}
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
                        value={watchedFields[index]?.value || undefined}
                        onValueChange={(value) => {
                          const selectedOption = allOptionSelects.find((option) => option.selectOptionEnum === value)
                          if (!selectedOption) return

                          update(index, {
                            value: selectedOption.selectOptionEnum,
                            selectedObject: selectedOption,
                            selectedValue: undefined,
                            selectedDate: undefined,
                          })
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SelectOptionBulkEditEvidence).map((option) => (
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
                            value={typeof item.selectedValue === 'string' ? item.selectedValue : undefined}
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
                        </div>
                      ) : item.selectedObject.inputType === InputType.Tag ? (
                        <div className="flex flex-col items-center gap-2">
                          <Controller
                            control={form.control}
                            name={`fieldsArray.${index}.selectedValue`}
                            render={({ field }) => {
                              return (
                                <MultipleSelector
                                  options={tagOptions}
                                  placeholder={item.selectedObject?.placeholder ?? 'Add tag...'}
                                  creatable
                                  value={tagValues}
                                  onChange={(selectedOptions) => {
                                    const values = selectedOptions.map((option) => option.value)
                                    field.onChange(values)
                                    setTagValues(
                                      selectedOptions.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                      })),
                                    )
                                  }}
                                  className="max-w-[300px]"
                                />
                              )
                            }}
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
              {fields.length < Object.keys(SelectOptionBulkEditEvidence).length ? (
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
