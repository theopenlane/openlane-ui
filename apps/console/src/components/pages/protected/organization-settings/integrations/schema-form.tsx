'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Textarea } from '@repo/ui/textarea'
import { Check, Copy, Lock, RefreshCw } from 'lucide-react'
import { toHumanLabel } from '@/utils/strings'
import { type IntegrationSchemaNode, type IntegrationSchemaProperty } from '@/lib/integrations/types'
import {
  type FormValues,
  type ResolvedSchemaField,
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
  const [copied, setCopied] = useState(false)

  const label = property.title?.trim() || toHumanLabel(fieldKey)
  const inputId = `integration-config-${fieldName}`
  const isEnum = Array.isArray(property.enum) && property.enum.length > 0
  const isBoolean = property.type === 'boolean'
  const isArray = property.type === 'array'
  const isMultiline = isArray || shouldRenderAsTextarea(fieldKey, property)
  const isGeneratable = property.generate === true
  const isSensitive = isSensitiveField(fieldKey, property)

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
          <FormLabel htmlFor={inputId} className="flex items-center gap-1.5">
            {label}
            {required ? <span className="text-red-500">*</span> : null}
            {isSensitive ? <Lock className="h-3 w-3 text-muted-foreground" aria-label="Secret field - value will not be saved by the browser" /> : null}
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
            ) : isGeneratable ? (
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Input
                  id={inputId}
                  {...field}
                  value={String(field.value ?? '')}
                  autoComplete={isSensitive ? 'new-password' : 'off'}
                  placeholder={property.example || property.examples?.[0] || ''}
                  type={inferInputType(fieldKey, property)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(`openlane-${crypto.randomUUID()}`)} title="Generate ID">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(String(field.value ?? ''))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Input
                id={inputId}
                {...field}
                value={String(field.value ?? '')}
                autoComplete={isSensitive ? 'new-password' : undefined}
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

type FieldEntry = { type: 'field'; field: ResolvedSchemaField } | { type: 'group'; groupLabel: string; fields: ResolvedSchemaField[] }

function buildFieldEntries(fields: ResolvedSchemaField[]): FieldEntry[] {
  const entries: FieldEntry[] = []
  for (const field of fields) {
    if (!field.groupLabel) {
      entries.push({ type: 'field', field })
      continue
    }
    const last = entries[entries.length - 1]
    if (last?.type === 'group' && last.groupLabel === field.groupLabel) {
      last.fields.push(field)
    } else {
      entries.push({ type: 'group', groupLabel: field.groupLabel, fields: [field] })
    }
  }
  return entries
}

export function IntegrationSchemaSections({
  sections,
  hideDescriptions,
  spacing = 'space-y-2',
  hideFieldKeys,
}: {
  sections: SchemaSection[]
  hideDescriptions?: boolean
  spacing?: string
  hideFieldKeys?: Set<string>
}) {
  return (
    <>
      {sections.map((section) => {
        const allFields = getResolvedSchemaFields(section.schema)
        const fields = hideFieldKeys ? allFields.filter((f) => !hideFieldKeys.has(f.nestedPath[0])) : allFields
        if (fields.length === 0) {
          return null
        }

        const entries = buildFieldEntries(fields)

        return (
          <div key={section.prefix}>
            {!hideDescriptions && section.description ? <p className="mb-4 text-xs text-muted-foreground">{section.description}</p> : null}

            <div className={spacing}>
              {entries.map((entry, i) => {
                if (entry.type === 'field') {
                  const { fieldKey, property, required } = entry.field
                  return <SchemaField key={`${section.prefix}${fieldKey}`} fieldKey={fieldKey} fieldName={`${section.prefix}${fieldKey}`} property={property} required={required} />
                }

                return (
                  <div key={`${section.prefix}group-${i}`} className="rounded-md border px-4 py-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{entry.groupLabel}</p>
                    <div className="space-y-3">
                      {entry.fields.map(({ fieldKey, property, required }) => (
                        <SchemaField key={`${section.prefix}${fieldKey}`} fieldKey={fieldKey} fieldName={`${section.prefix}${fieldKey}`} property={property} required={required} />
                      ))}
                    </div>
                  </div>
                )
              })}
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
