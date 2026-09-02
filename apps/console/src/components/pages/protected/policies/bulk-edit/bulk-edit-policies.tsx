'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEditInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { Input } from '@repo/ui/input'
import {
  checkHasFieldsToUpdate,
  collectBulkEditFieldInput,
  type BulkEditInputValue,
  type BulkEditPoliciesDialogProps,
  defaultObject,
  getAllSelectOptionsForBulkEditPolicies,
  useModuleFilteredSelectOptions,
  InputType,
  bulkEditFieldsSchema,
  type BulkEditFieldsFormValues,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { BulkEditTagField } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-tag-field'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { BulkEditSingleObjectAssociation } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-single-object-association'
import { BulkEditAssociationCollapsible } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-association-collapsible'
import { getAssociationSelectedCount } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { BulkEditValueSelect } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-value-select'
import { useBulkUpdateFeedback } from '@/components/shared/crud-base/use-bulk-update-feedback'

type BulkEditPoliciesFormValues = BulkEditFieldsFormValues

export const BulkEditPoliciesDialog: React.FC<BulkEditPoliciesDialogProps> = ({ selectedPolicies, setSelectedPolicies }) => {
  const [open, setOpen] = useState(false)
  const [collapsedAssociations, setCollapsedAssociations] = useState<Record<string, boolean>>({})
  const { mutateAsync: bulkEditPolicies } = useBulkEditInternalPolicy()
  const { errorNotification } = useNotification()
  const { notifyBulkUpdate } = useBulkUpdateFeedback()
  const form = useForm<BulkEditPoliciesFormValues>({
    resolver: zodResolver(bulkEditFieldsSchema),
    defaultValues: defaultObject,
  })
  const { data } = useGetAllGroups({ where: {} })
  const groups = useMemo(() => {
    if (!data) return
    return data?.groups?.edges?.map((edge) => edge?.node) || []
  }, [data])
  const {
    enumOptions,
    onCreateOption: createPolicyType,
    isSuccess: isTypesSuccess,
  } = useCreatableEnumOptions({
    objectType: 'internal_policy',
    field: 'kind',
  })

  const unfilteredOptionSelects = useMemo(() => {
    if (!groups || !isTypesSuccess) return []
    return getAllSelectOptionsForBulkEditPolicies(groups?.filter((g): g is NonNullable<typeof g> => Boolean(g)) ?? [], enumOptions)
  }, [groups, enumOptions, isTypesSuccess])
  const allOptionSelects = useModuleFilteredSelectOptions(unfilteredOptionSelects)

  const { control, handleSubmit } = form

  const watchedFields = useWatch({ control, name: 'fieldsArray' }) ?? []
  const hasFieldsToUpdate = checkHasFieldsToUpdate(watchedFields)

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
      })
    }
  }, [open, append])

  const onSubmit = async () => {
    const ids = selectedPolicies.map((policy) => policy.id)
    const input: Record<string, BulkEditInputValue> = {}
    if (watchedFields.length === 0) return

    if (ids.length === 0) return
    watchedFields.forEach((field) => collectBulkEditFieldInput(field, input))

    try {
      const result = await bulkEditPolicies({
        ids: ids,
        input,
      })
      const payload = result.updateBulkInternalPolicy
      if (
        !notifyBulkUpdate({
          requestedCount: ids.length,
          updatedIDs: payload?.updatedIDs,
          notUpdatedIDs: payload?.notUpdatedIDs,
          error: payload?.error,
          singular: 'policy',
          setSelected: setSelectedPolicies,
        })
      )
        return

      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit policy. Please try again.',
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
          <Button disabled={selectedPolicies.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedPolicies && selectedPolicies.length > 0 ? `Bulk Edit (${selectedPolicies.length})` : 'Bulk Edit'}
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
                    <div className="flex justify-items items-start gap-2">
                      <div className="flex flex-col items-start gap-2">
                        <Select
                          value={watchedFields[index]?.value || undefined}
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
                            {item.selectedObject.name === 'internalPolicyKindName' ? (
                              <CreatableCustomTypeEnumSelect
                                value={typeof item.selectedValue === 'string' ? item.selectedValue : undefined}
                                options={item.selectedObject?.options || []}
                                onCreateOption={createPolicyType}
                                triggerClassName="w-60"
                                placeholder={item.selectedObject?.placeholder ?? ''}
                                searchPlaceholder="Search policy type..."
                                onValueChange={(value) =>
                                  update(index, {
                                    ...item,
                                    selectedValue: value,
                                  })
                                }
                              />
                            ) : (
                              <BulkEditValueSelect
                                selectedObject={item.selectedObject}
                                value={typeof item.selectedValue === 'string' ? item.selectedValue : undefined}
                                onChange={(value) =>
                                  update(index, {
                                    ...item,
                                    selectedValue: value,
                                  })
                                }
                              />
                            )}
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
