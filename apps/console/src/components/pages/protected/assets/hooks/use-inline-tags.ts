'use client'

import { useMemo, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { usePersistFormField, type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type AssetFormData } from './use-form-schema'

type TUseInlineTagsArgs = {
  savedTags: string[]
  internalEditing: string | null
  setInternalEditing: (field: string | null) => void
  handleUpdate?: (input: UpdateAssetInput, options?: TPersistOptions) => Promise<void> | void
}

export const useInlineTags = ({ savedTags, internalEditing, setInternalEditing, handleUpdate }: TUseInlineTagsArgs) => {
  const { control, resetField } = useFormContext<AssetFormData>()
  const persistField = usePersistFormField<AssetFormData>()
  const tags = useWatch({ control, name: 'tags' })
  const tagValues = useMemo(() => (tags ?? []).map((tag) => ({ value: tag, label: tag })), [tags])
  const triggerRef = useRef<HTMLDivElement>(null)
  const isInlineEditing = internalEditing === 'tags'

  useClickOutsideWithPortal(
    () => {
      setInternalEditing(null)
      const next = tagValues.map(({ value }) => value)
      const isChanged = next.length !== savedTags.length || next.some((tag) => !savedTags.includes(tag))
      if (isChanged && handleUpdate) void persistField('tags', next, (options) => handleUpdate({ tags: next }, options))
    },
    { refs: { triggerRef }, enabled: isInlineEditing },
  )
  useEscapeKey(
    () => {
      resetField('tags')
      setInternalEditing(null)
    },
    { enabled: isInlineEditing },
  )

  return { control, tagValues, triggerRef, isInlineEditing }
}
