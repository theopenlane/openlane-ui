'use client'

import React, { useState } from 'react'
import { Group, InternalPolicyByIdFragment, UpdateInternalPolicyInput } from '@repo/codegen/src/schema'
import { Stamp, CircleArrowRight, HelpCircle } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Option } from '@repo/ui/multiple-selector'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { Card } from '@repo/ui/cardpanel'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TAuthorityCardProps = {
  form: UseFormReturn<EditPolicyMetadataFormData>
  approver?: InternalPolicyByIdFragment['approver']
  delegate?: InternalPolicyByIdFragment['delegate']
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateInternalPolicyInput) => void
  inputClassName?: string
  isCreate?: boolean
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, isCreate, approver, delegate, editAllowed, handleUpdate, inputClassName }) => {
  const [editingField, setEditingField] = useState<'approver' | 'delegate' | null>(null)

  const { data } = useGetAllGroups({ where: {}, enabled: isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.displayName || g?.name || '',
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
      <div className="flex items-center border-b border-border pb-3">
        <div className={`flex gap-2 min-w-40 items-center ${inputClassName ?? ''} `}>
          {icon}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="cursor-hel text-sm">{label}</span>
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
                onClose={() => setEditingField(null)}
                onChange={(val) => {
                  handleSelect(fieldKey, val)
                  field.onChange(val)
                }}
              />
            )}
          />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <HoverPencilWrapper showPencil={editAllowed} className={`min-w-40 w-full bg-unset }`}>
                <TooltipTrigger
                  type="button"
                  onDoubleClick={() => {
                    if (!isEditing && editAllowed) {
                      setEditingField(editingKey)
                    }
                  }}
                  className={`${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} bg-unset w-full`}
                >
                  <div className="flex gap-2 items-center">
                    <Avatar entity={value as Group} variant="small" />
                    <span className="truncate text-sm">{displayName}</span>
                  </div>
                </TooltipTrigger>
              </HoverPencilWrapper>
              <TooltipContent side="bottom">{displayName}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  if (!isCreate) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        {renderField('approverID', 'Approver', <Stamp size={16} className="text-brand" />, approver as Group, 'approver')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    )
  }

  return (
    <Card className="p-4">
      <div className="m-1">{renderField('approverID', 'Approver', <Stamp size={16} className="text-brand" />, approver as Group, 'approver')}</div>
      <div className="m-1">{renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}</div>
    </Card>
  )
}

export default AuthorityCard
