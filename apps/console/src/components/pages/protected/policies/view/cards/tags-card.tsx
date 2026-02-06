'use client'

import React, { Fragment, useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { InternalPolicyByIdFragment, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { CreatePolicyFormData } from '@/components/pages/protected/policies/create/hooks/use-form-schema.ts'
import useClickOutside from '@/hooks/useClickOutside'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

type TTagsCardProps = {
  form: UseFormReturn<CreatePolicyFormData>
  policy: InternalPolicyByIdFragment
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateInternalPolicyInput) => void
  activeField?: string | null
  setActiveField?: (field: string | null) => void
}

const TagsCard: React.FC<TTagsCardProps> = ({ form, policy, isEditing, editAllowed, handleUpdate, activeField, setActiveField }) => {
  const [internalInternalEditing, setInternalInternalEditing] = useState(false)
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const internalEditing = isControlled ? activeField === 'tags' : internalInternalEditing
  const setInternalEditing = (value: boolean) => {
    if (isControlled) {
      setActiveField?.(value ? 'tags' : null)
    } else {
      setInternalInternalEditing(value)
    }
  }
  const { tagOptions } = useGetTags()
  const { data: permission } = useOrganizationRoles()
  const canCreateTags = canEdit(permission?.roles)

  const tags = form.watch('tags')
  const tagValues = useMemo(() => {
    return (tags ?? [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => ({
        value: item,
        label: item,
      }))
  }, [tags])

  const wrapperRef = useClickOutside(() => {
    if (!internalEditing || isEditing) return
    const current = policy.tags || []
    const next = tagValues.map((item) => item.value)

    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed && handleUpdate) {
      handleUpdate({ tags: next })
    }

    setInternalEditing(false)
  })

  useEscapeKey(
    () => {
      setInternalEditing(false)
      const options: Option[] = (policy?.tags ?? []).filter((item): item is string => typeof item === 'string').map((item) => ({ value: item, label: item }))
      form.setValue(
        'tags',
        options.map((opt) => opt.value),
      )
    },
    { enabled: internalEditing },
  )

  return (
    <div className={`flex justify-between items-start ${isEditing || internalEditing ? 'flex-col items-start' : ''}`}>
      <div className="min-w-40">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Tag size={16} className="text-brand" />
            <span className="text-sm">Tags</span>
          </div>
        </div>
      </div>

      <div className="grid w-full items-center gap-2" ref={wrapperRef}>
        <div className="flex gap-2 items-center flex-wrap">
          {isEditing || internalEditing ? (
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <MultipleSelector
                        options={tagOptions}
                        hideClearAllButton
                        className="w-full"
                        placeholder="Add tag..."
                        creatable={canCreateTags}
                        value={tagValues}
                        onChange={(selectedOptions) => {
                          const newTags = selectedOptions.map((opt) => opt.value)
                          field.onChange(newTags)
                        }}
                      />
                    </FormControl>
                    {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                  </>
                )}
              />
            </InputRow>
          ) : (
            <HoverPencilWrapper
              showPencil={editAllowed}
              className={`flex gap-2 flex-wrap ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onPencilClick={() => {
                if (!isEditing && editAllowed) {
                  setInternalEditing(true)
                }
              }}
            >
              <div
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) {
                    setInternalEditing(true)
                  }
                }}
              >
                {policy.tags?.length ? (
                  <div className="flex gap-2 flex-wrap">
                    {policy.tags.map((tag) => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm italic">No tags</span>
                )}
              </div>
            </HoverPencilWrapper>
          )}
        </div>
      </div>
    </div>
  )
}

export default TagsCard
