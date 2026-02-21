'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { IntegrationCredentialsSchema, IntegrationProvider, IntegrationSchemaNode, IntegrationSchemaProperty } from './config'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: IntegrationProvider
}

type FormValues = Record<string, unknown>

const IntegrationConfigurationDialog = ({ open, onOpenChange, provider }: Props) => {
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<FormValues>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = provider?.credentialsSchema

  const fields = useMemo(() => {
    const properties = schema?.properties ?? {}
    return Object.entries(properties)
  }, [schema])
  const requiredDisplayFields = useMemo(() => collectDisplayRequiredFields(schema), [schema])

  useEffect(() => {
    if (!open || !schema) return
    setValues(initialValuesFromSchema(schema))
  }, [open, schema])

  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!provider || !schema) return

    const { payload, missingRequired } = normalizePayload(schema, values)
    if (missingRequired.length > 0) {
      errorNotification({
        title: `Missing required fields for ${provider.displayName}`,
        description: missingRequired.join(', '),
      })
      return
    }

    setIsSubmitting(true)
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
        const err = await parseErrorMessage(res)
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:w-[620px] p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Configure {provider?.displayName ?? 'Integration'}</SheetTitle>
          <SheetDescription>Provide credentials and settings required to connect this provider.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {fields.length === 0 && <p className="text-sm text-muted-foreground">This provider does not require credential input.</p>}
          {fields.map(([key, property]) => (
            <SchemaField
              key={key}
              fieldKey={key}
              property={property}
              required={requiredDisplayFields.has(key)}
              value={values[key]}
              onChange={(value) => updateValue(key, value)}
            />
          ))}
        </div>

        <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !provider}>
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type SchemaFieldProps = {
  fieldKey: string
  property: IntegrationSchemaProperty
  required: boolean
  value: unknown
  onChange: (value: unknown) => void
}

const SchemaField = ({ fieldKey, property, required, value, onChange }: SchemaFieldProps) => {
  const label = property.title?.trim() || toTitleCase(fieldKey)
  const inputId = `integration-config-${fieldKey}`

  const isEnum = Array.isArray(property.enum) && property.enum.length > 0
  const isBoolean = property.type === 'boolean'
  const isArray = property.type === 'array'

  return (
    <div className="space-y-2">
      {isBoolean ? (
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium">
          <input id={inputId} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      ) : (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {isEnum && !isBoolean && (
        <select id={inputId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={valueToString(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select value</option>
          {property.enum?.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      )}

      {!isEnum && !isBoolean && isArray && (
        <Textarea id={inputId} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder="Enter one value per line" rows={4} />
      )}

      {!isEnum && !isBoolean && !isArray && (
        <Input
          id={inputId}
          value={valueToString(value)}
          onChange={(e) => onChange(e.target.value)}
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

      {property.description && <p className="text-xs text-muted-foreground">{property.description}</p>}
    </div>
  )
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

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; details?: string; message?: string }
    return payload.error || payload.details || payload.message || `Request failed (${response.status})`
  } catch {
    const text = await response.text().catch(() => '')
    return text || `Request failed (${response.status})`
  }
}

export default IntegrationConfigurationDialog
