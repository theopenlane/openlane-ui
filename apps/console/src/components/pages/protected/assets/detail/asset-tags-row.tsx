'use client'

import React from 'react'
import { Controller } from 'react-hook-form'
import { Tag } from 'lucide-react'
import MultipleSelector from '@repo/ui/multiple-selector'
import { activatable } from '@repo/ui/lib/a11y'
import { FormMessage } from '@repo/ui/form'
import { cn } from '@repo/ui/lib/utils'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { useInlineTags } from '../hooks/use-inline-tags'
import { ASSET_ROW_LABEL_CLASS, type TAssetSectionProps } from './asset-field-props'

const AssetTagsRow: React.FC<TAssetSectionProps> = ({ asset, isEditing, canEdit, internalEditing, setInternalEditing, handleUpdate }) => {
  const tags = asset.tags ?? []
  const { tagOptions } = useGetTags()
  const { control, tagValues, triggerRef, isInlineEditing } = useInlineTags({ savedTags: tags, internalEditing, setInternalEditing, handleUpdate })
  const isFieldEditing = isEditing || isInlineEditing

  return (
    <div className={cn('flex', isFieldEditing ? 'flex-col gap-2' : 'items-center justify-between gap-4')}>
      <div className="flex shrink-0 items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className={ASSET_ROW_LABEL_CLASS}>Tags</span>
      </div>
      <div ref={triggerRef} className="w-full min-w-0">
        {isFieldEditing ? (
          <Controller
            name="tags"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  className="w-full"
                  placeholder="Add tag..."
                  creatable
                  value={tagValues}
                  onChange={(selected) => field.onChange(selected.map(({ value }) => value))}
                />
                <FormMessage error={fieldState.error} />
              </>
            )}
          />
        ) : (
          <div
            className={cn('flex w-full flex-wrap justify-end gap-2 rounded-md px-1 py-2 text-sm', canEdit && 'cursor-pointer hover:bg-accent')}
            {...activatable(canEdit ? () => setInternalEditing('tags') : undefined)}
          >
            {tags.length > 0 ? tags.map((tag) => <TagChip key={tag} tag={tag} />) : <span className="text-muted-foreground italic">No tags</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssetTagsRow
