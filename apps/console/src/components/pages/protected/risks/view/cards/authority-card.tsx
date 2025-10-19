'use client'

import React, { useState } from 'react'
import { Group, RiskFieldsFragment, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Stamp, CircleArrowRight } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TAuthorityCardProps = {
  form: UseFormReturn<EditRisksFormData>
  stakeholder?: RiskFieldsFragment['stakeholder']
  delegate?: RiskFieldsFragment['delegate']
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
  inputClassName?: string
  risk?: RiskFieldsFragment
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, stakeholder, delegate, isEditAllowed = true, handleUpdate, inputClassName, risk }) => {
  const [editingField, setEditingField] = useState<'stakeholder' | 'delegate' | null>(null)
  const { data } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.displayName || g?.name || '',
    value: g?.id || '',
  }))

  const handleSelect = (field: keyof EditRisksFormData, value: string) => {
    if (!isEditing && handleUpdate && risk) {
      let currentValue: string | null
      switch (field) {
        case 'stakeholderID':
          currentValue = risk.stakeholder?.id ?? null
          break
        case 'delegateID':
          currentValue = risk.delegate?.id ?? null
          break
        default:
          currentValue = null
      }
      // only call handleUpdate if the value actually changed
      if (currentValue !== value) {
        handleUpdate({ [field]: value })
      }
    }

    setEditingField(null)
  }

  const renderField = (fieldKey: keyof EditRisksFormData, label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'stakeholder' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = isEditAllowed && (isEditing || editingField === editingKey)

    return (
      <div className="flex justify-between items-center">
        <div className={`flex gap-2 w-[200px] items-center ${inputClassName ?? ''}`}>
          {icon}
          <span>{label}</span>
        </div>

        {showEditable ? (
          <Controller
            name={fieldKey}
            control={form.control}
            render={({ field }) => (
              <SearchableSingleSelect
                value={field.value as string}
                options={options}
                placeholder={`Select ${label.toLowerCase()}`}
                autoFocus
                onClose={() => setEditingField(null)}
                onChange={(val) => {
                  field.onChange(val)
                  handleSelect(fieldKey, val)
                }}
              />
            )}
          />
        ) : (
          <HoverPencilWrapper showPencil={isEditAllowed} className={`w-[200px] bg-unset ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onDoubleClick={() => {
                    if (!isEditing && isEditAllowed) setEditingField(editingKey)
                  }}
                  className="bg-unset"
                >
                  <div className="flex gap-2 items-center">
                    <Avatar entity={value as Group} variant="small" />
                    <span className="truncate">{displayName}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{displayName}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </HoverPencilWrapper>
        )}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Properties</h3>
      <div className="flex flex-col gap-4">
        {renderField('stakeholderID', 'Stakeholder', <Stamp size={16} className="text-brand" />, stakeholder as Group, 'stakeholder')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    </div>
  )
}

export default AuthorityCard
