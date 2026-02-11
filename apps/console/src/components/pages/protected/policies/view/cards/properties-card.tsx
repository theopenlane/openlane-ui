'use client'

import React, { useRef, useState } from 'react'
import { InternalPolicyByIdFragment, InternalPolicyDocumentStatus, UpdateInternalPolicyInput } from '@repo/codegen/src/schema'
import { Binoculars, Calendar, FileStack, ScrollText, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { formatDate } from '@/utils/date'
import { DocumentIconMapper, InternalPolicyStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

type TPropertiesCardProps = {
  form: UseFormReturn<EditPolicyMetadataFormData>
  policy: InternalPolicyByIdFragment
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateInternalPolicyInput) => void
  activeField?: string | null
  setActiveField?: (field: string | null) => void
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, policy, isEditing, editAllowed, handleUpdate, activeField, setActiveField }) => {
  const [internalEditingField, setInternalEditingField] = useState<null | 'status' | 'internalPolicyKindName' | 'reviewDue'>(null)
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const editingField = isControlled ? activeField : internalEditingField
  const setEditingField = isControlled ? setActiveField : setInternalEditingField

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.INTERNAL_POLICY),
      field: 'kind',
    },
  })

  const handleUpdateIfChanged = (field: 'status' | 'internalPolicyKindName', value: string, current: string | undefined | null) => {
    if (isEditing) {
      return
    }
    if (value !== current && handleUpdate) {
      handleUpdate({ [field]: value })
    }
    setEditingField(null)
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const reviewTriggerRef = useRef<HTMLDivElement>(null)
  const reviewPopoverRef = useRef<HTMLDivElement>(null)

  const isStatus = editingField === 'status'
  const isReviewDue = editingField === 'reviewDue'

  useEscapeKey(() => {
    if (editingField && (editingField === 'status' || editingField === 'internalPolicyKindName' || editingField === 'reviewDue')) {
      const value = policy?.[editingField]
      form.setValue(editingField, value || '')
      if (isControlled) {
        setActiveField?.(null)
      } else {
        setInternalEditingField(null)
      }
    }
  })

  useClickOutsideWithPortal(
    () => {
      setEditingField(null)
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: isStatus,
    },
  )

  useClickOutsideWithPortal(
    () => {
      setEditingField(null)
    },
    {
      refs: { reviewTriggerRef, reviewPopoverRef },
      enabled: isReviewDue,
    },
  )
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Status Required */}
      <div className="flex items-center gap-1 border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <Binoculars size={16} className="text-brand" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-help text-sm">Status</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The current state of the policy in the approval and publication workflow.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div ref={triggerRef} className="min-w-40 w-full">
          {isEditing || editingField === 'status' ? (
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2">
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      handleUpdateIfChanged('status', value, field.value)
                      field.onChange(value)
                    }}
                  >
                    <SelectTrigger className="w-full">{InternalPolicyStatusOptions.find((item) => item.value === field.value)?.label}</SelectTrigger>
                    <SelectContent ref={popoverRef}>
                      {InternalPolicyStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          ) : (
            <HoverPencilWrapper
              showPencil={editAllowed}
              className={`w-full  ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onPencilClick={() => {
                if (!isEditing && editAllowed) {
                  setEditingField('status')
                }
              }}
            >
              <div
                className="flex items-center space-x-2 w-full text-sm"
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) {
                    setEditingField('status')
                  }
                }}
              >
                {DocumentIconMapper[policy.status as InternalPolicyDocumentStatus]}
                <p>{InternalPolicyStatusOptions.find((item) => item.value === policy.status)?.label}</p>
              </div>
            </HoverPencilWrapper>
          )}
        </div>
      </div>

      {/* Version (read-only) */}
      <div className="flex items-center gap-1 border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <FileStack size={16} className="text-brand" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 ">
                  <span className="cursor-help text-sm">Version</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The revision number of this policy document, this is used to track changes to the policy.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="min-w-40 cursor-not-allowed">
          <span className="text-sm">{policy?.revision ?? '0.0.0'}</span>
        </div>
      </div>

      {/* Policy Type */}
      <div className="flex items-center gap-1 border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <ScrollText size={16} className="text-brand" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-help text-sm">Procedure Type</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The category or classification of this policy (e.g., Security, Compliance, Operational).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="min-w-40 w-full">
          {isEditing || editingField === 'internalPolicyKindName' ? (
            <FormField
              control={form.control}
              name="internalPolicyKindName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) => {
                        field.onChange(val)
                        handleUpdateIfChanged('internalPolicyKindName', val, policy?.internalPolicyKindName)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <CustomTypeEnumValue value={field.value} options={enumOptions ?? []} placeholder="Select type" />
                      </SelectTrigger>

                      <SelectContent ref={popoverRef}>
                        {enumOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <CustomTypeEnumOptionChip option={option} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  {form.formState.errors.internalPolicyKindName && <p className="text-red-500 text-sm">{form.formState.errors.internalPolicyKindName.message}</p>}
                </FormItem>
              )}
            />
          ) : (
            <HoverPencilWrapper
              showPencil={editAllowed}
              className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate text-sm`}
              onPencilClick={() => {
                if (!isEditing && editAllowed) setEditingField('internalPolicyKindName')
              }}
            >
              <div
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) setEditingField('internalPolicyKindName')
                }}
              >
                <div className="w-full block min-h-6">
                  <CustomTypeEnumValue value={policy?.internalPolicyKindName || ''} options={enumOptions ?? []}></CustomTypeEnumValue>
                </div>
              </div>
            </HoverPencilWrapper>
          )}
        </div>
      </div>

      {/* Review Date */}
      <div className="flex items-center gap-1 border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <Calendar size={16} className="text-brand" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-help text-sm">Review date</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The date when this policy should be reviewed for accuracy, relevance, and compliance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div ref={reviewTriggerRef} className="min-w-40 w-full">
          {isEditing || editingField === 'reviewDue' ? (
            <Controller
              name="reviewDue"
              control={form.control}
              render={({ field }) => (
                <>
                  <div ref={reviewPopoverRef}>
                    <CalendarPopover
                      field={field}
                      onChange={(date) => {
                        if (!isEditing && date !== policy.reviewDue) {
                          handleUpdate?.({ reviewDue: date })
                        }
                        setEditingField(null)
                      }}
                      disabledFrom={new Date()}
                      required
                    />
                  </div>
                  {form.formState.errors.reviewDue && <p className="text-red-500 text-sm">{form.formState.errors.reviewDue.message}</p>}
                </>
              )}
            />
          ) : (
            <HoverPencilWrapper
              showPencil={editAllowed}
              className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate text-sm`}
              onPencilClick={() => {
                if (!isEditing && editAllowed) setEditingField('reviewDue')
              }}
            >
              <div
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) setEditingField('reviewDue')
                }}
              >
                <span className="block min-h-6">{formatDate(policy?.reviewDue) || '\u00A0'}</span>
              </div>
            </HoverPencilWrapper>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertiesCard
