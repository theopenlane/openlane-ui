'use client'

import React, { useRef, useState } from 'react'
import { ProcedureByIdFragment, ProcedureDocumentStatus, UpdateProcedureInput } from '@repo/codegen/src/schema'
import { Binoculars, Calendar, FileStack, ScrollText, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { formatDate } from '@/utils/date'
import { DocumentIconMapper, ProcedureStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

type TPropertiesCardProps = {
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateProcedureInput) => void
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, procedure, isEditing, editAllowed, handleUpdate }) => {
  const [editingField, setEditingField] = useState<null | 'status' | 'procedureKindName' | 'reviewDue'>(null)

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'procedure',
      field: 'kind',
    },
  })

  const handleUpdateIfChanged = (field: 'status' | 'procedureKindName', value: string, current: string | undefined | null) => {
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
    if (editingField) {
      const value = procedure?.[editingField]
      form.setValue(editingField, value || '')
      setEditingField(null)
    }
  })

  useClickOutsideWithPortal(
    () => {
      setEditingField(null)
    },
    { refs: { triggerRef, popoverRef }, enabled: isStatus },
  )

  useClickOutsideWithPortal(
    () => {
      setEditingField(null)
    },
    { refs: { reviewTriggerRef, reviewPopoverRef }, enabled: isReviewDue },
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
                <p>The current state of the procedure in the approval and publication workflow.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div ref={triggerRef} className="min-w-40">
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
                    <SelectTrigger className="w-full">{ProcedureStatusOptions.find((item) => item.value === field.value)?.label}</SelectTrigger>
                    <SelectContent ref={popoverRef}>
                      {ProcedureStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                </div>
              )}
            />
          ) : (
            <div
              className={`flex items-center space-x-2 text-sm ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => {
                if (!isEditing && editAllowed) setEditingField('status')
              }}
            >
              {DocumentIconMapper[procedure.status as ProcedureDocumentStatus]}
              <p>{ProcedureStatusOptions.find((item) => item.value === procedure.status)?.label}</p>
            </div>
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
                <div className="flex items-center gap-1">
                  <span className="cursor-help text-sm">Version</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The revision number of this procedure document, this is used to track changes to the procedure.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="min-w-40 cursor-not-allowed">
          <div className="flex gap-2">
            <span className="text-sm">{procedure?.revision ?? '0.0.0'}</span>
          </div>
        </div>
      </div>

      {/* Procedure Type */}
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
                <p>The category or classification of this procedure (e.g., Operational, Emergency, Standard).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="min-w-40">
          {isEditing || editingField === 'procedureKindName' ? (
            <FormField
              control={form.control}
              name="procedureKindName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleUpdateIfChanged('procedureKindName', value, procedure?.procedureKindName)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <CustomTypeEnumValue value={field.value} options={enumOptions ?? []} placeholder="Select type" />
                        </SelectValue>
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

                  {form.formState.errors.procedureKindName && <p className="text-red-500 text-sm">{form.formState.errors.procedureKindName.message}</p>}
                </FormItem>
              )}
            />
          ) : (
            <div
              className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate`}
              onClick={() => {
                if (!isEditing && editAllowed) setEditingField('procedureKindName')
              }}
            >
              <span className="w-full block min-h-6 text-sm">{procedure?.procedureKindName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Review date */}
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
                <p>The next date when this procedure should be reviewed for accuracy, relevance, and compliance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div ref={reviewTriggerRef} className="min-w-40">
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
                        if (!isEditing && date !== procedure.reviewDue) {
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
            <div
              className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate`}
              onClick={() => {
                if (!isEditing && editAllowed) setEditingField('reviewDue')
              }}
            >
              <span className="block min-h-6 text-sm">{formatDate(procedure?.reviewDue) || '\u00A0'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertiesCard
