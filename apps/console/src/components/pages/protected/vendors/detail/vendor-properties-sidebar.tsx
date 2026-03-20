'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { type UpdateEntityInput, type EntityQuery, EntityEntityStatus, EntityFrequency } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { formatDate } from '@/utils/date'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type EditVendorFormData } from '../hooks/use-form-schema'
import { UserRound, UserRoundCheck, Settings2, Maximize2, Radio, CalendarDays, RefreshCw, DollarSign, Tag, Globe } from 'lucide-react'

const iconClass = 'h-4 w-4 text-muted-foreground'

interface VendorPropertiesSidebarProps {
  data: EntityQuery['entity']
  isEditing: boolean
  handleUpdate: (input: UpdateEntityInput) => Promise<void>
  canEdit: boolean
}

const VendorPropertiesSidebar: React.FC<VendorPropertiesSidebarProps> = ({ data, isEditing, handleUpdate, canEdit: canEditVendor }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { control, watch, setValue } = useFormContext<EditVendorFormData>()

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { tagOptions } = useGetTags()

  const tags = watch('tags')
  const tagValues = useMemo(() => {
    return (tags ?? []).filter((item: string): item is string => typeof item === 'string').map((item: string) => ({ value: item, label: item }))
  }, [tags])

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const blurTags = () => {
    const current = data?.tags || []
    const next = tagValues.map((item: { value: string; label: string }) => item.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed) {
      setValue('tags', next)
      handleUpdate({ tags: next })
    }
  }

  useClickOutsideWithPortal(
    () => {
      setInternalEditing(null)
      if (internalEditing === 'tags') {
        blurTags()
      }
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: internalEditing === 'tags',
    },
  )

  useEscapeKey(
    () => {
      if (internalEditing === 'tags') {
        const options: Option[] = (data?.tags ?? []).filter((item: string): item is string => typeof item === 'string').map((item: string) => ({ value: item, label: item }))
        setValue(
          'tags',
          options.map((opt) => opt.value),
        )
        setInternalEditing(null)
      }
    },
    { enabled: internalEditing === 'tags' },
  )

  const entityStatusOptions = enumToOptions(EntityEntityStatus)
  const reviewFrequencyOptions = enumToOptions(EntityFrequency)

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEditVendor,
    isCreate: false,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground',
  }

  return (
    <>
      <Card className="p-4 bg-card rounded-xl shadow-xs">
        <h3 className="text-lg font-medium mb-4">Properties</h3>
        <div className="flex flex-col gap-3">
          <ResponsibilityField
            name="internalOwner"
            fieldBaseName="internalOwner"
            label="Owner"
            icon={<UserRound className={iconClass} />}
            layout="horizontal"
            labelClassName="text-muted-foreground"
            isEditing={isEditing}
            isEditAllowed={canEditVendor}
            isCreate={false}
            internalEditing={internalEditing}
            setInternalEditing={setInternalEditing}
            handleUpdate={(input) => handleUpdate(input as UpdateEntityInput)}
          />

          <ResponsibilityField
            name="reviewedBy"
            fieldBaseName="reviewedBy"
            label="Reviewer"
            icon={<UserRoundCheck className={iconClass} />}
            layout="horizontal"
            labelClassName="text-muted-foreground"
            isEditing={isEditing}
            isEditAllowed={canEditVendor}
            isCreate={false}
            internalEditing={internalEditing}
            setInternalEditing={setInternalEditing}
            handleUpdate={(input) => handleUpdate(input as UpdateEntityInput)}
          />

          <SelectField name="status" label="Status" icon={<Settings2 className={iconClass} />} options={entityStatusOptions} {...sharedFieldProps} />

          <SelectField name="environmentName" label="Environment" icon={<Maximize2 className={iconClass} />} options={environmentOptions} onCreateOption={createEnvironment} {...sharedFieldProps} />

          <SelectField name="scopeName" label="Scope" icon={<Radio className={iconClass} />} options={scopeOptions} onCreateOption={createScope} {...sharedFieldProps} />

          <SelectField name="reviewFrequency" label="Review Frequency" icon={<RefreshCw className={iconClass} />} options={reviewFrequencyOptions} {...sharedFieldProps} />

          <TextField name="nextReviewAt" label="Next Review Date" icon={<CalendarDays className={iconClass} />} type="date" {...sharedFieldProps} />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <CalendarDays className={iconClass} />
              <span className="text-base text-muted-foreground">Last Updated</span>
            </div>
            <span className="text-sm py-2 px-1">{formatDate(data?.updatedAt)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <CalendarDays className={iconClass} />
              <span className="text-base text-muted-foreground">Last Reviewed</span>
            </div>
            <span className="text-sm py-2 px-1">{formatDate(data?.lastReviewedAt)}</span>
          </div>

          <TextField name="statusPageURL" label="Status Page" icon={<Globe className={iconClass} />} type="link" {...sharedFieldProps} />

          <div className={`flex ${isEditing || internalEditing === 'tags' ? 'flex-col gap-2' : 'items-center justify-between gap-4'}`}>
            <div className="flex items-center gap-2 shrink-0">
              <Tag className={iconClass} />
              <span className="text-base text-muted-foreground">Tags</span>
            </div>

            <div ref={triggerRef} className="w-full">
              {isEditing || internalEditing === 'tags' ? (
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <MultipleSelector
                      options={tagOptions}
                      hideClearAllButton
                      className="w-full"
                      placeholder="Add tag..."
                      creatable
                      value={tagValues}
                      onChange={(selectedOptions) => {
                        const newTags = selectedOptions.map((opt) => opt.value)
                        field.onChange(newTags)
                      }}
                    />
                  )}
                />
              ) : (
                <div
                  className={`text-sm py-2 rounded-md px-1 w-full hover:bg-accent ${canEditVendor ? 'cursor-pointer' : ''}`}
                  onClick={() => canEditVendor && !isEditing && setInternalEditing('tags')}
                >
                  {data?.tags?.length ? (
                    <div className="flex gap-2 flex-wrap justify-end">
                      {data.tags.map((tag) => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No tags</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card rounded-xl shadow-xs">
        <h3 className="text-lg font-medium mb-4">Contract</h3>
        <div className="flex flex-col gap-3">
          <DateField name="contractStartDate" label="Start Date" {...sharedFieldProps} />
          <DateField name="contractEndDate" label="End Date" {...sharedFieldProps} />
          <DateField name="contractRenewalAt" label="Renewal Date" {...sharedFieldProps} />
          <TextField name="terminationNoticeDays" label="Termination Notice Days" {...sharedFieldProps} />
          <TextField name="annualSpend" label="Spend" type="currency" icon={<DollarSign className={iconClass} />} {...sharedFieldProps} />
          <TextField name="billingModel" label="Billing Model" {...sharedFieldProps} />
          <CheckboxField name="autoRenews" label="Auto Renews" {...sharedFieldProps} />
        </div>
      </Card>
    </>
  )
}

export default VendorPropertiesSidebar
