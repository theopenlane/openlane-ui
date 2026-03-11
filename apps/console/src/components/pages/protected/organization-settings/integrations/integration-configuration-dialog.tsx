'use client'

import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm, useFormContext, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { type IntegrationCredentialsSchema, type IntegrationProvider, type IntegrationSchemaNode, type IntegrationSchemaProperty, parseIntegrationErrorMessage } from './config'
import { toHumanLabel } from '@/utils/strings'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: IntegrationProvider
}

type FormValues = Record<string, unknown>

const IntegrationConfigurationDialog = ({ open, onOpenChange, provider }: Props) => {
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const schema = provider?.credentialsSchema
  const fields = useMemo(() => Object.entries(schema?.properties ?? {}), [schema])
  const requiredDisplayFields = useMemo(() => collectDisplayRequiredFields(schema), [schema])
  const zodSchema = useMemo(() => buildZodSchema(schema), [schema])

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: schema ? initialValuesFromSchema(schema) : {},
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = formMethods

  useEffect(() => {
    if (!open || !schema) return
    reset(initialValuesFromSchema(schema))
  }, [open, schema, reset])

  const onSubmit = async (formValues: FormValues) => {
    if (!provider || !schema) return

    const { payload, missingRequired } = normalizePayload(schema, formValues)
    if (missingRequired.length > 0) {
      errorNotification({
        title: `Missing required fields for ${provider.displayName}`,
        description: missingRequired.join(', '),
      })
      return
    }

    try {
      const res = await fetch('/api/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.name,
          payload,
        }),
      })

      if (!res.ok) {
        const err = await parseIntegrationErrorMessage(res)
        throw new Error(err)
      }

      successNotification({
        title: `${provider.displayName} configured`,
        description: 'Integration credentials were saved successfully.',
      })

      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: `Failed to configure ${provider.displayName}`,
        description: error instanceof Error ? error.message : 'Unexpected error while configuring integration.',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:w-[620px] p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Configure {provider?.displayName ?? 'Integration'}</SheetTitle>
          <SheetDescription>Provide credentials and settings required to connect this provider.</SheetDescription>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {fields.length === 0 && <p className="text-sm text-muted-foreground">This provider does not require credential input.</p>}
              {fields.map(([key, property]) => (
                <SchemaField key={key} fieldKey={key} property={property} required={requiredDisplayFields.has(key)} />
              ))}
            </div>

            <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !provider}>
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}

type SchemaFieldProps = {
  fieldKey: string
  property: IntegrationSchemaProperty
  required: boolean
}

const SchemaField = ({ fieldKey, property, required }: SchemaFieldProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext()
  const label = property.title?.trim() || toHumanLabel(fieldKey)
  const inputId = `integration-config-${fieldKey}`

  const isEnum = Array.isArray(property.enum) && property.enum.length > 0
  const isBoolean = property.type === 'boolean'
  const isArray = property.type === 'array'

  const errorMessage = errors[fieldKey]?.message as string | undefined

  return (
    <div className="space-y-2">
      {isBoolean ? (
        <Controller
          name={fieldKey}
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <Label htmlFor={inputId}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Switch id={inputId} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      ) : (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {isEnum && !isBoolean && (
        <Controller
          name={fieldKey}
          control={control}
          render={({ field }) => (
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
          )}
        />
      )}

      {!isEnum && !isBoolean && isArray && <Textarea id={inputId} {...register(fieldKey)} placeholder="Enter one value per line" rows={4} />}

      {!isEnum && !isBoolean && !isArray && (
        <Input
          id={inputId}
          {...register(fieldKey)}
          type={inferInputType(property)}
          placeholder={property.example || property.examples?.[0] || ''}
          min={property.minimum}
          max={property.maximum}
          minLength={property.minLength}
          maxLength={property.maxLength}
          pattern={property.pattern}
          autoComplete={property.format === 'password' || property.secret ? 'new-password' : undefined}
        />
      )}

      {errorMessage && <p className="text-destructive text-xs font-medium">{errorMessage}</p>}
      {property.description && <p className="text-xs text-muted-foreground">{property.description}</p>}
    </div>
  )
}

function buildZodSchema(credentialsSchema?: IntegrationCredentialsSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (!credentialsSchema?.properties) return z.object({})

  const requiredFields = collectDisplayRequiredFields(credentialsSchema)
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, property] of Object.entries(credentialsSchema.properties)) {
    if (property.type === 'boolean') {
      shape[key] = z.boolean()
      continue
    }

    const label = property.title?.trim() || toHumanLabel(key)
    if (requiredFields.has(key)) {
      shape[key] = z.string().min(1, `${label} is required`)
    } else {
      shape[key] = z.string()
    }
  }

  return z.object(shape)
}

function initialValuesFromSchema(schema: IntegrationCredentialsSchema): FormValues {
  const properties = schema.properties ?? {}
  const values: FormValues = {}

  for (const [key, property] of Object.entries(properties)) {
    if (property.default !== undefined) {
      if (property.type === 'array' && Array.isArray(property.default)) {
        values[key] = property.default.join('\n')
      } else {
        values[key] = property.default
      }
      continue
    }

    if (property.type === 'boolean') {
      values[key] = false
      continue
    }

    values[key] = ''
  }

  return values
}

function normalizePayload(schema: IntegrationCredentialsSchema, values: FormValues): { payload: Record<string, unknown>; missingRequired: string[] } {
  const payload: Record<string, unknown> = {}
  const missingRequired: string[] = []
  const required = new Set(schema.required ?? [])

  for (const [key, property] of Object.entries(schema.properties ?? {})) {
    const rawValue = values[key]

    if (property.type === 'boolean') {
      payload[key] = Boolean(rawValue)
      continue
    }

    if (property.type === 'array') {
      const list = String(rawValue ?? '')
        .split(/[\n,]+/)
        .map((part) => part.trim())
        .filter(Boolean)

      if (list.length > 0) {
        payload[key] = list
      } else if (required.has(key)) {
        missingRequired.push(property.title || key)
      }
      continue
    }

    if (property.type === 'integer') {
      const parsed = Number.parseInt(String(rawValue ?? ''), 10)
      if (!Number.isNaN(parsed)) {
        payload[key] = parsed
      } else if (required.has(key)) {
        missingRequired.push(property.title || key)
      }
      continue
    }

    if (property.type === 'number') {
      const parsed = Number.parseFloat(String(rawValue ?? ''))
      if (!Number.isNaN(parsed)) {
        payload[key] = parsed
      } else if (required.has(key)) {
        missingRequired.push(property.title || key)
      }
      continue
    }

    const trimmed = String(rawValue ?? '').trim()
    if (trimmed) {
      payload[key] = trimmed
    } else if (required.has(key)) {
      missingRequired.push(property.title || key)
    }
  }

  return { payload, missingRequired }
}

function collectDisplayRequiredFields(schema?: IntegrationCredentialsSchema): Set<string> {
  const required = new Set<string>()
  if (!schema) {
    return required
  }

  const visit = (node?: IntegrationSchemaNode) => {
    if (!node) {
      return
    }

    if (Array.isArray(node.required)) {
      for (const key of node.required) {
        if (typeof key === 'string' && key.trim() !== '') {
          required.add(key)
        }
      }
    }

    for (const child of node.allOf ?? []) {
      visit(child)
    }
    for (const child of node.anyOf ?? []) {
      visit(child)
    }
    for (const child of node.oneOf ?? []) {
      visit(child)
    }

    visit(node.if)
    visit(node.then)
    visit(node.else)
  }

  visit(schema)
  return required
}

function inferInputType(property: IntegrationSchemaProperty): React.HTMLInputTypeAttribute {
  if (property.type === 'number' || property.type === 'integer') return 'number'
  if (property.format === 'password' || property.secret) return 'password'
  if (property.format === 'email') return 'email'
  if (property.format === 'uri' || property.format === 'url') return 'url'
  return 'text'
}

export default IntegrationConfigurationDialog
