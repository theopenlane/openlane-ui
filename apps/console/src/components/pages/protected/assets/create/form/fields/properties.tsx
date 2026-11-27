'use client'

import React from 'react'
import { Controller } from 'react-hook-form'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { Tag } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { type AssetQuery, type UpdateAssetInput } from '@repo/codegen/src/schema'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useInlineTags } from '../../../hooks/use-inline-tags'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { FormMessage } from '@repo/ui/form'

type PropertiesProps = {
  isEditing: boolean
  data: AssetQuery['asset'] | undefined
  internalEditing: string | null
  setInternalEditing: (field: string | null) => void
  handleUpdateField?: (val: UpdateAssetInput, options?: TPersistOptions) => Promise<void> | void
  isEditAllowed: boolean
}

const Properties: React.FC<PropertiesProps> = ({ isEditing, data, internalEditing, setInternalEditing, handleUpdateField, isEditAllowed }) => {
  const { tagOptions } = useGetTags()
  const { control, tagValues, triggerRef, isInlineEditing } = useInlineTags({ savedTags: data?.tags ?? [], internalEditing, setInternalEditing, handleUpdate: handleUpdateField })

  const renderTags = () => {
    const hasTags = data?.tags && data.tags.length > 0

    return (
      <div className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex flex-wrap gap-2`}>
        {hasTags ? data?.tags?.map((tag, i) => tag && <TagChip tag={tag} key={i} />) : <span className="text-muted-foreground text-sm italic">No tags</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tags */}
      <div className="flex items-center gap-4">
        <Tag className="text-muted-foreground" size={16} />
        <p className="text-sm w-[120px]">Tags</p>

        {isEditing || isInlineEditing ? (
          <Controller
            name="tags"
            control={control}
            render={({ field, fieldState }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  placeholder="Add tag..."
                  creatable
                  commandProps={{ className: 'w-full' }}
                  value={tagValues}
                  onChange={(selectedOptions) => field.onChange(selectedOptions.map((opt) => opt.value))}
                />
                <FormMessage error={fieldState.error} />
              </div>
            )}
          />
        ) : (
          <HoverPencilWrapper
            showPencil={isEditAllowed}
            className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} pr-5`}
            onPencilClick={() => isEditAllowed && !isEditing && setInternalEditing('tags')}
          >
            <div onDoubleClick={() => isEditAllowed && !isEditing && setInternalEditing('tags')}>{renderTags()}</div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

export default Properties
