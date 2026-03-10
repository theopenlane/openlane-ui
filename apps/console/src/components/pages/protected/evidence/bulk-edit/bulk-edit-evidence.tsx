'use client'
import {
  checkHasFieldsToUpdate,
  collectAssociationInput,
  type BulkEditEvidenceDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEditEvidence,
  getMappedClearValue,
  InputType,
  bulkEditFieldsSchema,
  type BulkEditFieldsFormValues,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { useBulkEditEvidence } from '@/lib/graphql-hooks/evidence'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { ClientError } from 'graphql-request'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { BulkEditTagField } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-tag-field'
import { BulkEditSingleObjectAssociation } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-single-object-association'
import { BulkEditAssociationCollapsible } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-association-collapsible'
import { getAssociationSelectedCount } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'

type BulkEditEvidenceFormValues = BulkEditFieldsFormValues

export const BulkEditEvidenceDialog: React.FC<BulkEditEvidenceDialogProps> = ({ selectedEvidence, setSelectedEvidence }: BulkEditEvidenceDialogProps) => {
  const [open, setOpen] = useState(false)
  const [collapsedAssociations, setCollapsedAssociations] = useState<Record<string, boolean>>({})
  const { mutateAsync: bulkEditEvidence } = useBulkEditEvidence()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditEvidenceFormValues>({
    resolver: zodResolver(bulkEditFieldsSchema),
    defaultValues: defaultObject,
  })
  const { control, handleSubmit } = form
  const watchedFields = useWatch({ control, name: 'fieldsArray' }) ?? []
  const hasFieldsToUpdate = checkHasFieldsToUpdate(watchedFields)

  const allOptionSelects = useMemo(() => {
    return getAllSelectOptionsForBulkEditEvidence()
  }, [])

  const { fields, append, update, replace, remove } = useFieldArray({
    control,
    name: 'fieldsArray',
    rules: { maxLength: allOptionSelects.length },
  })

  useEffect(() => {
    if (open) {
      append({
        value: undefined,
        selectedValue: undefined,
        selectedDate: undefined,
      })
    }
  }, [open, append])

  const onSubmit = async () => {
    const ids = selectedEvidence.map((evidence) => evidence.id)
    const input: Record<string, string | string[] | boolean> = {}
    if (watchedFields.length === 0) return

    if (ids.length === 0) return
    watchedFields.forEach((field) => {
      if (collectAssociationInput(field, input)) return

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
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          replace([])
          setCollapsedAssociations({})
        }
        setOpen(value)
      }}
    >
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedEvidence.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedEvidence && selectedEvidence.length > 0 ? `Bulk Edit (${selectedEvidence.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bulk edit</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              {fields.map((item, index) => {
                const isObjectAssociation = item.selectedObject?.inputType === InputType.ObjectAssociation
                return (
                  <div key={item.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 w-full">
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
                            {allOptionSelects.map((option) => (
                              <SelectItem key={option.selectOptionEnum} value={option.selectOptionEnum} disabled={fields.some((f, i) => f.value === option.selectOptionEnum && i !== index)}>
                                {option.selectOptionEnum}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {item.selectedObject &&
                        !isObjectAssociation &&
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
                          <BulkEditTagField control={form.control} name={`fieldsArray.${index}.selectedValue`} placeholder={item.selectedObject?.placeholder} />
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
                    {isObjectAssociation && item.selectedObject?.objectType && (
                      <BulkEditAssociationCollapsible
                        isCollapsed={!!collapsedAssociations[item.id]}
                        selectedCount={getAssociationSelectedCount(watchedFields[index]?.selectedAssociations)}
                        displayLabel={item.selectedObject.selectOptionEnum}
                        onToggle={() => setCollapsedAssociations((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      >
                        <BulkEditSingleObjectAssociation objectType={item.selectedObject.objectType} onChange={(map) => form.setValue(`fieldsArray.${index}.selectedAssociations`, map)} />
                      </BulkEditAssociationCollapsible>
                    )}
                  </div>
                )
              })}
              {fields.length < allOptionSelects.length ? (
                <Button
                  icon={<Plus />}
                  onClick={() => {
                    setCollapsedAssociations((prev) => {
                      const next = { ...prev }
                      fields.forEach((f) => {
                        if (f.selectedObject?.inputType === InputType.ObjectAssociation) next[f.id] = true
                      })
                      return next
                    })
                    append({
                      value: undefined,
                      selectedValue: undefined,
                      selectedDate: undefined,
                    })
                  }}
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
