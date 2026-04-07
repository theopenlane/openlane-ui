'use client'

import React, { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Textarea } from '@repo/ui/textarea'
import { toHumanLabel } from '@/utils/strings'
import { type IntegrationSchemaNode, type IntegrationSchemaProperty } from '@/lib/integrations/types'
import {
  type FormValues,
  type SchemaSection,
  buildInitialValues,
  buildSections,
  buildZodSchema,
  getResolvedSchemaFields,
  inferInputType,
  isSensitiveField,
  shouldRenderAsTextarea,
} from '@/lib/integrations/schema'

export { CREDENTIALS_PREFIX, normalizeIntegrationFormPayloads, USER_INPUT_PREFIX } from '@/lib/integrations/schema'
export type { FormValues, NormalizedIntegrationFormPayloads, SchemaSection } from '@/lib/integrations/schema'

type SchemaFieldProps = {
  fieldKey: string
  fieldName: string
  property: IntegrationSchemaProperty
  required: boolean
}

type UseIntegrationSchemaFormOptions = {
  credentialSchema?: IntegrationSchemaNode
  userInputSchema?: IntegrationSchemaNode
  credentialSectionMeta?: { title: string; description: string }
  userInputSectionMeta?: { title: string; description: string }
}

export const SchemaField = ({ fieldKey, fieldName, property, required }: SchemaFieldProps) => {
  const { control } = useFormContext<FormValues>()

  const label = property.title?.trim() || toHumanLabel(fieldKey)
  const inputId = `integration-config-${fieldName}`
  const isEnum = Array.isArray(property.enum) && property.enum.length > 0
  const isBoolean = property.type === 'boolean'
  const isArray = property.type === 'array'
  const isMultiline = isArray || shouldRenderAsTextarea(fieldKey, property)

  if (isBoolean) {
    return (
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <FormLabel htmlFor={inputId}>
                {label}
                {required ? <span className="ml-1 text-red-500">*</span> : null}
              </FormLabel>
              <FormControl>
                <Switch id={inputId} checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
              </FormControl>
            </div>
            {property.description ? <p className="text-xs text-muted-foreground">{property.description}</p> : null}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel htmlFor={inputId}>
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </FormLabel>
          <FormControl>
            {isEnum ? (
              <Select value={String(field.value ?? '')} onValueChange={field.onChange}>
                <SelectTrigger id={inputId}>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {property.enum?.map((option) => (
                    <SelectItem key={String(option)} value={String(option)}>
                      {String(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : isMultiline ? (
              <Textarea
                id={inputId}
                {...field}
                value={String(field.value ?? '')}
                placeholder={property.example || property.examples?.[0] || (isArray ? 'Enter one value per line' : '')}
                rows={isArray ? 4 : 6}
              />
            ) : (
              <Input
                id={inputId}
                {...field}
                value={String(field.value ?? '')}
                autoComplete={isSensitiveField(fieldKey, property) ? 'new-password' : undefined}
                max={property.maximum}
                maxLength={property.maxLength}
                min={property.minimum}
                minLength={property.minLength}
                pattern={property.pattern}
                placeholder={property.example || property.examples?.[0] || ''}
                type={inferInputType(fieldKey, property)}
              />
            )}
          </FormControl>
          {property.description ? <p className="text-xs text-muted-foreground">{property.description}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function IntegrationSchemaSections({ sections, hideDescriptions, spacing = 'space-y-2' }: { sections: SchemaSection[]; hideDescriptions?: boolean; spacing?: string }) {
  return (
    <>
      {sections.map((section) => {
        const fields = getResolvedSchemaFields(section.schema)
        if (fields.length === 0) {
          return null
        }

        return (
          <div key={section.prefix}>
            {!hideDescriptions && section.description ? <p className="mb-4 text-xs text-muted-foreground">{section.description}</p> : null}

            <div className={spacing}>
              {fields.map(({ fieldKey, property, required }) => (
                <SchemaField key={`${section.prefix}${fieldKey}`} fieldKey={fieldKey} fieldName={`${section.prefix}${fieldKey}`} property={property} required={required} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

export function useIntegrationSchemaForm({ credentialSchema, userInputSchema, credentialSectionMeta, userInputSectionMeta }: UseIntegrationSchemaFormOptions) {
  const sections = useMemo(
    () => buildSections(credentialSchema, userInputSchema, credentialSectionMeta, userInputSectionMeta),
    [credentialSchema, credentialSectionMeta, userInputSchema, userInputSectionMeta],
  )
  const initialValues = useMemo(() => buildInitialValues(sections), [sections])
  const zodSchema = useMemo(() => buildZodSchema(sections), [sections])

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: initialValues,
  })
  const { reset } = formMethods

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  return {
    formMethods,
    initialValues,
    sections,
  }
}
