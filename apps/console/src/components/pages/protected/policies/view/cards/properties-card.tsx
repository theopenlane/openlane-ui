'use client'

import React, { useRef, useState } from 'react'
import { InternalPolicyByIdFragment, InternalPolicyDocumentStatus, UpdateInternalPolicyInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, Calendar, FileStack, ScrollText, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { formatDate } from '@/utils/date'
import { DocumentIconMapper, InternalPolicyStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { CalendarPopover } from '@repo/ui/calendar-popover'

type TPropertiesCardProps = {
  form: UseFormReturn<EditPolicyMetadataFormData>
  policy: InternalPolicyByIdFragment
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateInternalPolicyInput) => void
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, policy, isEditing, editAllowed, handleUpdate }) => {
  const [editingField, setEditingField] = useState<null | 'status' | 'policyType' | 'reviewDue'>(null)

  const handleUpdateIfChanged = (field: 'status' | 'policyType', value: string, current: string | undefined | null) => {
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
      const value = policy?.[editingField]
      form.setValue(editingField, value || '')
      setEditingField(null)
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
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Properties</h3>
      <div className="flex flex-col gap-4">
        {/* Status Required */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <Binoculars size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="cursor-help">Status</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The current state of the policy in the approval and publication workflow.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div ref={triggerRef} className="w-[200px]">
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
              <div
                className={`flex items-center space-x-2 ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) setEditingField('status')
                }}
              >
                {DocumentIconMapper[policy.status as InternalPolicyDocumentStatus]}
                <p>{InternalPolicyStatusOptions.find((item) => item.value === policy.status)?.label}</p>
              </div>
            )}
          </div>
        </div>

        {/* Version (read-only) */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <FileStack size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 ">
                    <span className="cursor-help">Version</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The revision number of this policy document, this is used to track changes to the policy.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-[200px] cursor-not-allowed">
            <span>{policy?.revision ?? '0.0.0'}</span>
          </div>
        </div>

        {/* Policy Type */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <ScrollText size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="cursor-help">Policy Type</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The category or classification of this policy (e.g., Security, Compliance, Operational).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="w-[200px]">
            {isEditing || editingField === 'policyType' ? (
              <FormField
                control={form.control}
                name="policyType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        variant="medium"
                        {...field}
                        onBlur={() => handleUpdateIfChanged('policyType', field.value, policy?.policyType)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault()
                            handleUpdateIfChanged('policyType', field.value, policy?.policyType)
                          }
                        }}
                        autoFocus
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : (
              <div
                className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate`}
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) setEditingField('policyType')
                }}
              >
                <span className="w-full block min-h-6">{policy?.policyType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Review Date */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <Calendar size={16} className="text-brand" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="cursor-help">Review date</span>
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The date when this policy should be reviewed for accuracy, relevance, and compliance.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div ref={reviewTriggerRef} className="w-[200px]">
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
              <div
                className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} truncate`}
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) setEditingField('reviewDue')
                }}
              >
                <span className="block min-h-6">{formatDate(policy?.reviewDue) || '\u00A0'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PropertiesCard
