'use client'

import React, { useMemo, useRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Tag } from 'lucide-react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { EditVendorFormData } from '../../../hooks/use-form-schema'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'

type PropertiesProps = {
  isEditing: boolean
  data: EntityQuery['entity'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (val: UpdateEntityInput) => void
  isEditAllowed: boolean
}

const allProperties = ['tags']

const Properties: React.FC<PropertiesProps> = ({ isEditing, data, internalEditing, setInternalEditing, handleUpdateField, isEditAllowed }) => {
  const { control, formState, watch, setValue } = useFormContext<EditVendorFormData>()

  const { tagOptions } = useGetTags()

  const tags = watch('tags')
  const tagValues = useMemo(() => {
    return (tags ?? [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => ({
        value: item,
        label: item,
      }))
  }, [tags])

  const renderTags = () => {
    const hasTags = data?.tags && data.tags.length > 0

    return (
      <div className={`${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'} flex flex-wrap gap-2`}>
        {hasTags ? data?.tags?.map((tag, i) => tag && <TagChip tag={tag} key={i} />) : <span className="text-muted-foreground text-sm italic">No tags</span>}
      </div>
    )
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const blurTags = () => {
    const current = data?.tags || []
    const next = tagValues.map((item) => item.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed && handleUpdateField) {
      setValue('tags', next)
      handleUpdateField({ tags: next })
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
      enabled: !!internalEditing && allProperties.includes(internalEditing),
    },
  )

  useEscapeKey(
    () => {
      if (!internalEditing) {
        return
      }
      if (internalEditing === 'tags') {
        const options: Option[] = (data?.tags ?? []).filter((item): item is string => typeof item === 'string').map((item) => ({ value: item, label: item }))
        setValue(
          'tags',
          options.map((opt) => opt.value),
        )
        setInternalEditing(null)
      }
    },
    { enabled: !!internalEditing && allProperties.includes(internalEditing) },
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Tags */}
      <div className="flex items-center gap-4">
        <Tag className="text-primary" size={16} />
        <p className="text-sm w-[120px]">Tags</p>

        {isEditing || internalEditing === 'tags' ? (
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="w-[250px]" ref={triggerRef}>
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  placeholder="Add tag..."
                  creatable
                  commandProps={{ className: 'w-full' }}
                  value={tagValues}
                  onChange={(selectedOptions) => {
                    const newTags = selectedOptions.map((opt) => opt.value)
                    field.onChange(newTags)
                  }}
                />
                {formState.errors.tags && <p className="text-red-500 text-sm">{formState.errors.tags.message}</p>}
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
