'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, useFieldArray, useWatch, type Path } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Pencil, PlusIcon as Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEditControl } from '@/lib/graphql-hooks/control'
import {
  collectAssociationInput,
  type BulkEditControlsDialogProps,
  type BulkEditLinkedControlsDialogProps,
  type BulkEditSubcontrolsDialogProps,
  defaultObject,
  SelectOptionBulkEditControls,
  useGetAllSelectOptionsForBulkEditControls,
  InputType,
  bulkEditFieldsSchema,
  type BulkEditFieldsFormValues,
  type SelectOptionSelectedObject,
  getAllSelectOptionsForBulkEditLinkedControls,
  getAllSelectOptionsForBulkEditSubcontrols,
} from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { type Group } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { EditableSelectFromQuery } from '../propereties-card/fields/editable-select-from-query'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { BulkEditTagField } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-tag-field'
import { objectToSnakeCase } from '@/utils/strings'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { BulkEditSingleObjectAssociation } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-single-object-association'
import { BulkEditAssociationCollapsible } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-association-collapsible'
import { getAssociationSelectedCount } from '@/components/shared/bulk-edit-shared-objects/bulk-edit-shared-objects'
import { useBulkEditSubcontrol } from '@/lib/graphql-hooks/subcontrol'

type BulkEditControlsFormValues = BulkEditFieldsFormValues
type BulkEditSelection = { id: string; refCode: string }
type BulkEditInputValue = string | string[]
type BulkEditInput = Record<string, BulkEditInputValue>

type BulkEditRecordsDialogProps = {
  selectedItems: BulkEditSelection[]
  allOptionSelects: SelectOptionSelectedObject[]
  onCreateType?: (value: string) => Promise<void>
  onBulkEdit: (ids: string[], input: BulkEditInput) => Promise<void>
  onClearSelectedItems: () => void
  successTitle: string
  errorTitle: string
}

const useBulkEditOptionData = () => {
  const { data } = useGetAllGroups({ where: {} })
  const { enumOptions, onCreateOption: createControlType } = useCreatableEnumOptions({
    objectType: objectToSnakeCase(ObjectTypes.CONTROL),
    field: 'kind',
  })

  const groups = useMemo(() => {
    if (!data) return []
    return data.groups?.edges?.map((edge) => edge?.node).filter((group): group is Group => Boolean(group)) ?? []
  }, [data])

  return { groups, enumOptions, createControlType }
}

const BulkEditRecordsDialog: React.FC<BulkEditRecordsDialogProps> = ({ selectedItems, allOptionSelects, onCreateType, onBulkEdit, onClearSelectedItems, successTitle, errorTitle }) => {
  const [open, setOpen] = useState(false)
  const [collapsedAssociations, setCollapsedAssociations] = useState<Record<string, boolean>>({})
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditControlsFormValues>({
    resolver: zodResolver(bulkEditFieldsSchema),
    defaultValues: defaultObject,
  })

  const { control, handleSubmit } = form
  const watchedFields = useWatch({ control, name: 'fieldsArray' }) ?? []

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
    const ids = selectedItems.map((item) => item.id)
    const input: BulkEditInput = {}
    if (watchedFields.length === 0) return
    if (ids.length === 0) return

    watchedFields.forEach((field) => {
      if (collectAssociationInput(field, input)) return

      const key = field.selectedObject?.name
      if (!key) return
      if (field.selectedValue && field.value) {
        input[key] = field.selectedValue
        return
      }
      const value = form.getValues(key as Path<BulkEditControlsFormValues>)
      if (typeof value === 'string' && value.trim() !== '') {
        input[key] = value
      }
    })

    try {
      await onBulkEdit(ids, input)
      successNotification({
        title: successTitle,
      })
      onClearSelectedItems()
      setOpen(false)
    } catch (error) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? errorTitle,
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
          <Button disabled={selectedItems.length === 0} icon={<Pencil />} iconPosition="left" variant="secondary">
            {selectedItems.length > 0 ? `Bulk Edit (${selectedItems.length})` : 'Bulk Edit'}
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
                      {item.selectedObject && item.selectedObject.inputType === InputType.Select && (
                        <div className="flex flex-col items-center gap-2">
                          {item.selectedObject.name === 'controlKindName' || item.selectedObject.name === 'subcontrolKindName' || item.selectedObject.name === 'kindName' ? (
                            <CreatableCustomTypeEnumSelect
                              value={typeof item.selectedValue === 'string' ? item.selectedValue : undefined}
                              options={item.selectedObject?.options || []}
                              onCreateOption={onCreateType}
                              triggerClassName="w-60"
                              placeholder={item.selectedObject?.placeholder}
                              searchPlaceholder="Search control type..."
                              onValueChange={(value) =>
                                update(index, {
                                  ...item,
                                  selectedValue: value,
                                })
                              }
                            />
                          ) : (
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
                                <SelectValue placeholder={item.selectedObject?.placeholder}>
                                  <CustomTypeEnumValue
                                    value={typeof item.selectedValue === 'string' ? item.selectedValue : undefined}
                                    options={item.selectedObject?.options || []}
                                    placeholder={item.selectedObject?.placeholder}
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
                        </div>
                      )}
                      {item.selectedObject && item.selectedObject.inputType === InputType.TypeAhead && (
                        <div className="flex flex-col items-center gap-2">
                          <EditableSelectFromQuery
                            iconAndLabelVisible={false}
                            label={item.selectedObject.selectOptionEnum}
                            name={item.selectedObject.name}
                            isEditAllowed
                            isEditing
                            hasGap={false}
                            gridColWidth="240"
                            icon={item.selectedObject.selectOptionEnum === SelectOptionBulkEditControls.Category ? controlIconsMap.Category : controlIconsMap.SubCategory}
                          />
                        </div>
                      )}
                      {item.selectedObject && item.selectedObject.inputType === InputType.Tag && (
                        <BulkEditTagField control={form.control} name={`fieldsArray.${index}.selectedValue`} placeholder={item.selectedObject?.placeholder} />
                      )}
                      <Button icon={<Trash2 />} iconPosition="center" variant="secondary" onClick={() => remove(index)} />
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
              <SaveButton onClick={form.handleSubmit(onSubmit)} />
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

export const BulkEditControlsDialog: React.FC<BulkEditControlsDialogProps> = ({ selectedControls, setSelectedControls, onClearSelectedControls }) => {
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { groups, enumOptions, createControlType } = useBulkEditOptionData()
  const allOptionSelects = useGetAllSelectOptionsForBulkEditControls(groups, enumOptions)

  const clearSelectedControls = () => {
    if (onClearSelectedControls) {
      onClearSelectedControls()
      return
    }

    setSelectedControls?.([])
  }

  return (
    <BulkEditRecordsDialog
      selectedItems={selectedControls}
      allOptionSelects={allOptionSelects}
      onCreateType={createControlType}
      onBulkEdit={async (ids, input) => {
        await bulkEditControl({ ids, input })
      }}
      onClearSelectedItems={clearSelectedControls}
      successTitle="Successfully bulk updated selected controls."
      errorTitle="Failed to bulk edit control. Please try again."
    />
  )
}

export const BulkEditSubcontrolsDialog: React.FC<BulkEditSubcontrolsDialogProps> = ({ selectedSubcontrols, setSelectedSubcontrols, onClearSelectedSubcontrols }) => {
  const { mutateAsync: bulkEditSubcontrol } = useBulkEditSubcontrol()
  const { groups, enumOptions, createControlType } = useBulkEditOptionData()
  const allOptionSelects = useMemo(() => getAllSelectOptionsForBulkEditSubcontrols(groups, enumOptions), [groups, enumOptions])

  const clearSelectedSubcontrols = () => {
    if (onClearSelectedSubcontrols) {
      onClearSelectedSubcontrols()
      return
    }

    setSelectedSubcontrols?.([])
  }

  return (
    <BulkEditRecordsDialog
      selectedItems={selectedSubcontrols}
      allOptionSelects={allOptionSelects}
      onCreateType={createControlType}
      onBulkEdit={async (ids, input) => {
        await bulkEditSubcontrol({ ids, input })
      }}
      onClearSelectedItems={clearSelectedSubcontrols}
      successTitle="Successfully bulk updated selected subcontrols."
      errorTitle="Failed to bulk edit subcontrols. Please try again."
    />
  )
}

export const BulkEditLinkedControlsDialog: React.FC<BulkEditLinkedControlsDialogProps> = ({ selectedControls, selectedSubcontrols, onClearSelectedControls }) => {
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { mutateAsync: bulkEditSubcontrol } = useBulkEditSubcontrol()
  const { groups, enumOptions, createControlType } = useBulkEditOptionData()
  const controlOptionSelects = useGetAllSelectOptionsForBulkEditControls(groups, enumOptions)
  const subcontrolOptionSelects = useMemo(() => getAllSelectOptionsForBulkEditSubcontrols(groups, enumOptions), [groups, enumOptions])
  const linkedOptionSelects = useMemo(() => getAllSelectOptionsForBulkEditLinkedControls(groups, enumOptions), [groups, enumOptions])
  const selectedItems = useMemo(() => [...selectedControls, ...selectedSubcontrols], [selectedControls, selectedSubcontrols])

  const allOptionSelects = useMemo(() => {
    if (selectedControls.length > 0 && selectedSubcontrols.length === 0) return controlOptionSelects
    if (selectedSubcontrols.length > 0 && selectedControls.length === 0) return subcontrolOptionSelects
    return linkedOptionSelects
  }, [controlOptionSelects, linkedOptionSelects, selectedControls.length, selectedSubcontrols.length, subcontrolOptionSelects])

  return (
    <BulkEditRecordsDialog
      selectedItems={selectedItems}
      allOptionSelects={allOptionSelects}
      onCreateType={createControlType}
      onBulkEdit={async (_ids, input) => {
        const { kindName, ...rest } = input
        const controlInput = kindName !== undefined ? { ...rest, controlKindName: kindName } : rest
        const subcontrolInput = kindName !== undefined ? { ...rest, subcontrolKindName: kindName } : rest
        await Promise.all([
          selectedControls.length > 0 ? bulkEditControl({ ids: selectedControls.map((control) => control.id), input: controlInput }) : null,
          selectedSubcontrols.length > 0 ? bulkEditSubcontrol({ ids: selectedSubcontrols.map((subcontrol) => subcontrol.id), input: subcontrolInput }) : null,
        ])
      }}
      onClearSelectedItems={onClearSelectedControls}
      successTitle="Successfully bulk updated selected linked controls."
      errorTitle="Failed to bulk edit linked controls. Please try again."
    />
  )
}
