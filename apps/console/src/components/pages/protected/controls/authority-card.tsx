'use client'

import React, { useState } from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { ControlDetailsFieldsFragment, Group, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Option } from '@repo/ui/multiple-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'

interface AuthorityCardProps {
  controlOwner?: ControlDetailsFieldsFragment['controlOwner']
  delegate?: ControlDetailsFieldsFragment['delegate']
  isEditing: boolean
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  isEditAllowed?: boolean
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate, isEditing, handleUpdate, isEditAllowed }) => {
  const [editingField, setEditingField] = useState<'owner' | 'delegate' | null>(null)
  const { data } = useGetAllGroups({ where: {}, enabled: !!isEditing || !!editingField })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))

  const handleSelect = (field: 'controlOwnerID' | 'delegateID', value: string) => {
    if (isEditing) return
    handleUpdate?.({ [field]: value })
    setEditingField(null)
  }

  const renderField = (fieldKey: 'controlOwnerID' | 'delegateID', label: string, icon: React.ReactNode, value: Group | null | undefined, editingKey: 'owner' | 'delegate') => {
    const displayName = value?.displayName || `No ${label}`
    const showEditable = isEditAllowed && (isEditing || editingField === editingKey)

    return (
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          {icon}
          <span>{label}</span>
        </div>

        {showEditable ? (
          <SearchableSingleSelect options={options} placeholder={`Select ${label.toLowerCase()}`} onChange={(val) => handleSelect(fieldKey, val)} onClose={() => setEditingField(null)} autoFocus />
        ) : (
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={`w-[200px] ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} `}
                onDoubleClick={() => {
                  if (!isEditing && isEditAllowed) setEditingField(editingKey)
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
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {renderField('controlOwnerID', 'Owner', <CircleUser size={16} className="text-brand" />, controlOwner as Group, 'owner')}
        {renderField('delegateID', 'Delegate', <CircleArrowRight size={16} className="text-brand" />, delegate as Group, 'delegate')}
      </div>
    </Card>
  )
}

export default AuthorityCard
