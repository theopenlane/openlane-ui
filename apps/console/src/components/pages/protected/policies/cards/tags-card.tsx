'use client'

import React, { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Tag } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { CreatePolicyFormData } from '@/components/pages/protected/policies/hooks/use-form-schema.ts'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'

type TTagsCardProps = {
  form: UseFormReturn<CreatePolicyFormData>
}

const TagsCard: React.FC<TTagsCardProps> = ({ form }) => {
  const [tagValues, setTagValues] = useState<Option[]>([])
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Tags */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Tag size={16} className="text-brand" />
            <span>Tags</span>
          </div>

          <div className="flex gap-2">
            {/* Tags Field */}
            <InputRow className="w-full">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <MultipleSelector
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
                        className="w-full"
                      />
                    </FormControl>
                    {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                  </FormItem>
                )}
              />
            </InputRow>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TagsCard
