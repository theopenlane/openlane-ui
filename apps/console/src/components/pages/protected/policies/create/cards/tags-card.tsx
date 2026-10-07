'use client'

import React, { useMemo } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Tag } from 'lucide-react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { InputRow } from '@repo/ui/input'
import { FormControl, FormField } from '@repo/ui/form'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { type CreatePolicyFormData } from '@/components/pages/protected/policies/create/hooks/use-form-schema.ts'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useSession } from 'next-auth/react'

type TTagsCardProps = {
  form: UseFormReturn<CreatePolicyFormData>
}

const toTagOptions = (tags: CreatePolicyFormData['tags']): Option[] => tags.flatMap((tag) => (tag ? [{ value: tag, label: tag }] : []))

const TagsCard: React.FC<TTagsCardProps> = ({ form }) => {
  const { tagOptions } = useGetTags()
  const tags = useWatch({ control: form.control, name: 'tags' })
  const tagValues = useMemo(() => toTagOptions(tags), [tags])
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRoles()
  const canCreateTags = canEdit(permission?.roles, session)

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
                        creatable={canCreateTags}
                        value={tagValues}
                        options={tagOptions}
                        onChange={(selectedOptions) => field.onChange(selectedOptions.map((option) => option.value))}
                      />
                    </FormControl>
                    {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                  </>
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
