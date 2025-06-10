'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Tag } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { RiskFieldsFragment } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'

type TTagsCardProps = {
  form: UseFormReturn<EditRisksFormData>
  risk: RiskFieldsFragment
  isEditing: boolean
}

const TagsCard: React.FC<TTagsCardProps> = ({ form, risk, isEditing }) => {
  const [tagValues, setTagValues] = useState<Option[]>([])

  useEffect(() => {
    if (form.getValues('tags')) {
      const tags = form.getValues('tags').map((item) => {
        return {
          value: item,
          label: item,
        } as Option
      })
      setTagValues(tags)
    }
  }, [])

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Tags */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Tag size={16} className="text-brand" />
            <span>Tags</span>
          </div>
        </div>
        <div className="grid w-full items-center gap-2">
          <div className="flex gap-2 items-center">
            {isEditing && (
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
                          value={tagValues}
                          onChange={(selectedOptions) => {
                            const options = selectedOptions.map((option) => option.value)
                            field.onChange(options)
                            setTagValues(
                              selectedOptions.map((item) => {
                                return {
                                  value: item.value,
                                  label: item.label,
                                }
                              }),
                            )
                          }}
                        />
                      </FormControl>
                      {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                    </>
                  )}
                />
              </InputRow>
            )}
            {!isEditing &&
              risk.tags?.map((item, index) => (
                <Fragment key={index}>
                  <Badge className="bg-background-secondary mr-1" variant="outline">
                    {item}
                  </Badge>
                </Fragment>
              ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TagsCard
