'use client'

import React, { Fragment, useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { RiskFieldsFragment, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import useClickOutside from '@/hooks/useClickOutside'
import useEscapeKey from '@/hooks/useEscapeKey'

type TTagsCardProps = {
  form: UseFormReturn<EditRisksFormData>
  risk: RiskFieldsFragment
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
}

const TagsCard: React.FC<TTagsCardProps> = ({ form, risk, isEditing, isEditAllowed = true, handleUpdate }) => {
  const [internalEditing, setInternalEditing] = useState(false)

  const tags = form.watch('tags')
  const tagOptions = useMemo(() => {
    return (tags ?? [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => ({
        value: item,
        label: item,
      }))
  }, [tags])

  const wrapperRef = useClickOutside(() => {
    if (!internalEditing || isEditing) return
    const current = risk.tags || []
    const next = tagOptions.map((item) => item.value)

    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed && handleUpdate) {
      handleUpdate({ tags: next })
    }

    setInternalEditing(false)
  })

  useEscapeKey(
    () => {
      setInternalEditing(false)
      const options: Option[] = (risk?.tags ?? []).filter((item): item is string => typeof item === 'string').map((item) => ({ value: item, label: item }))
      form.setValue(
        'tags',
        options.map((opt) => opt.value),
      )
    },
    { enabled: internalEditing },
  )

  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Label */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Tag size={16} className="text-brand" />
            <span>Tags</span>
          </div>
        </div>

        {/* Tags or Input */}
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
                          className="w-full"
                          placeholder="Add tag..."
                          creatable
                          value={tagOptions}
                          onChange={(selectedOptions) => {
                            const newTags = selectedOptions.map((opt) => opt.value)
                            field.onChange(newTags)
                          }}
                          hideClearAllButton
                        />
                      </FormControl>
                      {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                    </>
                  )}
                />
              </InputRow>
            ) : (
              <div
                className={`flex gap-2 flex-wrap ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onDoubleClick={() => {
                  if (!isEditing && isEditAllowed) {
                    setInternalEditing(true)
                  }
                }}
              >
                {risk.tags?.length ? (
                  risk.tags.map((item, index) => (
                    <Fragment key={index}>
                      <Badge className="bg-background-secondary mr-1" variant="outline">
                        {item}
                      </Badge>
                    </Fragment>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">No tags</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TagsCard
