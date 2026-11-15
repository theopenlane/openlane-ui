'use client'

import React, { useState } from 'react'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'

type TInlineEnumStatusProps = {
  objectType: string
  value: string | null | undefined
  isEditing: boolean
  canEdit: boolean
  onSave: (next: string) => Promise<unknown>
}

export const InlineEnumStatus: React.FC<TInlineEnumStatusProps> = ({ objectType, value, isEditing, canEdit, onSave }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const { enumOptions, onCreateOption, isPending } = useCreatableEnumOptions({ objectType, field: 'status' })
  const startInlineEdit = () => {
    if (canEdit && !isEditing) setIsInlineEditing(true)
  }

  if (isInlineEditing && !isEditing) {
    return (
      <CreatableCustomTypeEnumSelect
        value={value ?? ''}
        options={enumOptions}
        onCreateOption={onCreateOption}
        defaultOpen
        onOpenChange={(open) => {
          if (!open) setIsInlineEditing(false)
        }}
        triggerClassName="h-8 min-w-40"
        onValueChange={async (next) => {
          setIsInlineEditing(false)
          if (next !== (value ?? '')) await onSave(next)
        }}
      />
    )
  }

  return (
    <HoverPencilWrapper showPencil={canEdit && !isEditing} onPencilClick={startInlineEdit} pencilAriaLabel="Edit status">
      <div onDoubleClick={startInlineEdit} className="flex min-h-6 items-center">
        <CustomTypeEnumValue value={value ?? undefined} options={enumOptions} placeholder={isPending ? undefined : 'Unknown'} showUnmatchedValue={!isPending} />
      </div>
    </HoverPencilWrapper>
  )
}
