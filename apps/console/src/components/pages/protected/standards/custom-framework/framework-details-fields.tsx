'use client'

import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { cn } from '@repo/ui/lib/utils'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { useStandardCategories } from '@/lib/graphql-hooks/standard'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { toKebabCase } from '@/utils/strings'
import { generateShortName, isGeneratedFrom } from './custom-framework'
import { type TFrameworkDetailsFormData } from './hooks/use-custom-framework-form-schema'

type TFrameworkDetailsFieldsProps = {
  isCreate?: boolean
}

const toTagOptions = (tags: string[]): Option[] => tags.map((tag) => ({ value: tag, label: tag }))

export const FrameworkDetailsFields: React.FC<TFrameworkDetailsFieldsProps> = ({ isCreate = false }) => {
  const { control, getValues, setValue } = useFormContext<TFrameworkDetailsFormData>()
  const { categories } = useStandardCategories()
  const { tagOptions } = useGetTags()
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRoles()
  const canCreateTags = canEdit(permission?.roles, session)
  const tags = useWatch({ control, name: 'tags' })

  const handleNameChange = (nextName: string) => {
    if (!isCreate) return
    const previousName = getValues('name') ?? ''

    if (isGeneratedFrom(getValues('shortName'), previousName, generateShortName)) {
      setValue('shortName', generateShortName(nextName), { shouldDirty: true, shouldValidate: !!nextName })
    }
    if (isGeneratedFrom(getValues('framework'), previousName, toKebabCase)) {
      setValue('framework', toKebabCase(nextName), { shouldDirty: true })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Acme Security Baseline"
                {...field}
                onChange={(event) => {
                  handleNameChange(event.target.value)
                  field.onChange(event)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={control}
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Short name</FormLabel>
              <FormControl>
                <Input placeholder="ASB" {...field} />
              </FormControl>
              <FormDescription>Shown on chips, tags and the generated icon.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="framework"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Framework key</FormLabel>
              <FormControl>
                <Input placeholder="acme-security-baseline" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>{isCreate ? 'Generated from the name. ' : ''}A stable identifier for the framework.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="standardType"
        render={({ field }) => (
          <FormItem>
            <FormLabel required={isCreate}>Category</FormLabel>
            <FormControl>
              <Input placeholder="cybersecurity" {...field} value={field.value ?? ''} />
            </FormControl>
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Categories used by other standards">
                <span className="text-xs text-muted-foreground">Used by other standards:</span>
                {categories.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="tag"
                    aria-pressed={field.value === category}
                    className={cn(field.value === category && 'is-active')}
                    onClick={() => field.onChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={control}
          name="governingBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Governing body</FormLabel>
              <FormControl>
                <Input placeholder="Acme Security Team" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Version</FormLabel>
              <FormControl>
                <Input placeholder="2026.1" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Your own label, such as a year or edition.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link</FormLabel>
            <FormControl>
              <Input placeholder="https://wiki.example.com/security/baseline" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>Where the source document lives.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <MultipleSelector
                className="w-full"
                placeholder="Add tag..."
                creatable={canCreateTags}
                value={toTagOptions(tags ?? [])}
                options={tagOptions}
                onChange={(selected) => field.onChange(selected.map((option) => option.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="What this framework covers and who it applies to." {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
