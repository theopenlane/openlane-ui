'use client'

import React, { useState } from 'react'
import { Group, ProcedureByIdFragment, UpdateProcedureInput } from '@repo/codegen/src/schema'
import { Stamp, CircleArrowRight, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'

type TAuthorityCardProps = {
  form: UseFormReturn<EditProcedureMetadataFormData>
  approver?: ProcedureByIdFragment['approver']
  delegate?: ProcedureByIdFragment['delegate']
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateProcedureInput) => void
  inputClassName?: string
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, approver, delegate, editAllowed, handleUpdate, inputClassName }) => {
  const [editingField, setEditingField] = useState<'approver' | 'delegate' | null>(null)

  const { data } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))
  const handleSelect = (field: 'approverID' | 'delegateID', value: string) => {
    const currentValue = form.getValues(field)

    if (!isEditing && handleUpdate && currentValue !== value) {
      handleUpdate({ [field]: value })
    }

    setEditingField(null)
  }

  const renderField = (fieldKey: 'approverID' | 'delegateID', label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'approver' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = editAllowed && (isEditing || editingField === editingKey)

    return (
      <div className="flex items-center gap-1">
        <div className={`flex gap-2 min-w-[160px] items-center ${inputClassName ?? ''} `}>
          {icon}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-help">{label}</span>
                  <HelpCircle size={12} className="text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {label === 'Approver'
                    ? 'The group or individual responsible for approving this policy before it can be published.'
                    : 'The group or individual who can act on behalf of the approver when they are unavailable.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showEditable ? (
          <Controller
            name={fieldKey}
            control={form.control}
            render={({ field }) => (
              <SearchableSingleSelect
                value={field.value}
                options={options}
                placeholder={`Select ${label.toLowerCase()}`}
                autoFocus
                onChange={(val) => {
                  handleSelect(fieldKey, val)
                  field.onChange(val)
                }}
                onClose={() => setEditingField(null)}
              />
            )}
          />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={`min-w-[160px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) {
                    setEditingField(editingKey)
                  }
                }}
              >
                <div className="flex gap-2 items-center">
                  <Avatar entity={value as Group} variant="small" />
                  <span className="truncate">{displayName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{displayName}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {renderField('approverID', 'Approver', <Stamp size={16} className="text-brand" />, approver as Group, 'approver')}
      {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
    </div>
  )
}

export default AuthorityCard
