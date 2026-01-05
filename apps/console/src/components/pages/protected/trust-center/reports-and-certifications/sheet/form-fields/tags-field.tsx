'use client'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

interface Props {
  isEditing: boolean
}

export const TagsField = ({ isEditing }: Props) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext()

  const tags = watch('tags') || []
  const { tagOptions } = useGetTags()

  return (
    <div className="flex flex-col gap-2">
      <Label>Tags</Label>
      {isEditing ? (
        <>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <MultipleSelector
                options={tagOptions}
                creatable
                value={(field.value ?? []).map((tag: string) => ({ value: tag, label: tag }))}
                onChange={(selected) => field.onChange(selected.map((s) => s.value))}
              />
            )}
          />
          {errors.tags && <p className="text-red-500 text-sm mt-1">{String(errors.tags.message)}</p>}
        </>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1">{tags.length ? tags.map((tag: string, i: number) => <TagChip tag={tag} key={i} />) : <p className="text-base text-muted-foreground">—</p>}</div>
      )}
    </div>
  )
}
