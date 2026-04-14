'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { type UpdateIdentityHolderInput, type IdentityHolderQuery } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { formatDate } from '@/utils/date'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type EditPersonnelFormData } from '../hooks/use-form-schema'
import { UserRound, CalendarDays, Tag, Hash, KeyRound } from 'lucide-react'

const iconClass = 'h-4 w-4 text-muted-foreground'

interface PersonnelPropertiesSidebarProps {
  data: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  handleUpdate: (input: UpdateIdentityHolderInput) => Promise<void>
  canEdit: boolean
}

const PersonnelPropertiesSidebar: React.FC<PersonnelPropertiesSidebarProps> = ({ data, isEditing, handleUpdate, canEdit: canEditPersonnel }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { control, watch, setValue } = useFormContext<EditPersonnelFormData>()

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

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEditPersonnel,
    isCreate: false,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground',
  }

  return (
    <Card className="p-4 bg-card rounded-xl shadow-xs">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="flex flex-col gap-3">
        <TextField name="externalUserID" label="External User ID" icon={<Hash className={iconClass} />} tooltipContent="The user ID in an external system" {...sharedFieldProps} />

        <TextField name="externalReferenceID" label="External Ref ID" icon={<KeyRound className={iconClass} />} tooltipContent="A reference ID from an external system" {...sharedFieldProps} />

        <ResponsibilityField
          name="internalOwner"
          fieldBaseName="internalOwner"
          label="Internal Owner"
          icon={<UserRound className={iconClass} />}
          layout="horizontal"
          labelClassName="text-muted-foreground"
          tooltipContent="The internal owner responsible for this personnel record"
          isEditing={isEditing}
          isEditAllowed={canEditPersonnel}
          isCreate={false}
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={(input) => handleUpdate(input as UpdateIdentityHolderInput)}
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays className={iconClass} />
            <span className="text-base text-muted-foreground">Last Updated</span>
          </div>
          <span className="text-sm py-2 px-1">{formatDate(data?.updatedAt)}</span>
        </div>

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
                className={`text-sm py-2 rounded-md px-1 w-full hover:bg-accent ${canEditPersonnel ? 'cursor-pointer' : ''}`}
                onClick={() => canEditPersonnel && !isEditing && setInternalEditing('tags')}
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
  )
}

export default PersonnelPropertiesSidebar
