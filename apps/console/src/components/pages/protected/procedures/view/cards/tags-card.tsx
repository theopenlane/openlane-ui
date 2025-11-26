'use client'

import React, { Fragment, useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { ProcedureByIdFragment, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { CreateProcedureFormData } from '../../create/hooks/use-form-schema'
import useClickOutside from '@/hooks/useClickOutside'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useGetTags } from '@/lib/graphql-hooks/tags'

type TTagsCardProps = {
  form: UseFormReturn<CreateProcedureFormData>
  procedure: ProcedureByIdFragment
  isEditing: boolean
  editAllowed: boolean
  handleUpdate?: (val: UpdateProcedureInput) => void
}

const TagsCard: React.FC<TTagsCardProps> = ({ form, procedure, isEditing, editAllowed, handleUpdate }) => {
  const [internalEditing, setInternalEditing] = useState(false)
  const { tagOptions } = useGetTags()

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
    const current = procedure.tags || []
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
      const options: Option[] = (procedure?.tags ?? []).filter((item): item is string => typeof item === 'string').map((item) => ({ value: item, label: item }))
      form.setValue(
        'tags',
        options.map((opt) => opt.value),
      )
    },
    { enabled: internalEditing },
  )

  return (
    <div className={`flex justify-between items-start ${isEditing || internalEditing ? 'flex-col items-start' : ''}`}>
      <div className="min-w-[160px]">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Tag size={16} className="text-brand" />
            <span>Tags</span>
          </div>
        </div>
      </div>

      <div className="grid w-full items-center gap-2">
        <div className="flex gap-2 items-center flex-wrap" ref={wrapperRef}>
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
                        creatable
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
            <HoverPencilWrapper showPencil={editAllowed} className={`flex gap-2 flex-wrap w-full ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <div
                onDoubleClick={() => {
                  if (!isEditing && editAllowed) {
                    setInternalEditing(true)
                  }
                }}
              >
                {procedure.tags?.length ? (
                  procedure.tags.map((item, index) => (
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
            </HoverPencilWrapper>
          )}
        </div>
      </div>
    </div>
  )
}

export default TagsCard
