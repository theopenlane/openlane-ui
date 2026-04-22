import { z } from 'zod'
import { toHumanLabel } from '@/utils/strings'
import { collectRequiredSchemaFields, resolveSchemaNode, schemaHasProperties } from '@/lib/integrations/utils'
import { type IntegrationSchemaNode, type IntegrationSchemaProperty } from '@/lib/integrations/types'

export type FormValues = Record<string, unknown>

export type SchemaSection = {
  description: string
  prefix: string
  schema: IntegrationSchemaNode
  title: string
}

export type ResolvedSchemaField = {
  fieldKey: string
  nestedPath: string[]
  groupLabel?: string
  property: IntegrationSchemaProperty
  required: boolean
}

export type NormalizedIntegrationFormPayloads = {
  credentialPayload: { missingRequired: string[]; payload: Record<string, unknown> }
  hasCredentialPayload: boolean
  hasUserInputPayload: boolean
  missingRequired: string[]
  userInputPayload: { missingRequired: string[]; payload: Record<string, unknown> }
}

const EMAIL_SCHEMA = z.string().email()
const URL_SCHEMA = z.string().url()

export const CREDENTIALS_PREFIX = 'credentials__'
export const USER_INPUT_PREFIX = 'userInput__'

export function buildSections(
  credentialSchema: IntegrationSchemaNode | undefined,
  userInputSchema: IntegrationSchemaNode | undefined,
  credentialSectionMeta?: { title: string; description: string },
  userInputSectionMeta?: { title: string; description: string },
): SchemaSection[] {
  const sections: SchemaSection[] = []

  if (schemaHasProperties(credentialSchema)) {
    sections.push({
      prefix: CREDENTIALS_PREFIX,
      schema: credentialSchema as IntegrationSchemaNode,
      title: credentialSectionMeta?.title ?? 'Credentials',
      description: credentialSectionMeta?.description ?? 'We store these installation-specific values and use them to authenticate',
    })
  }

  if (schemaHasProperties(userInputSchema)) {
    sections.push({
      prefix: USER_INPUT_PREFIX,
      schema: userInputSchema as IntegrationSchemaNode,
      title: userInputSectionMeta?.title ?? 'Configuration',
      description: userInputSectionMeta?.description ?? 'These settings control installation-specific behavior defined by the integration',
    })
  }

  return sections
}

export function buildInitialValues(sections: SchemaSection[], existingValuesByPrefix: Record<string, Record<string, unknown> | undefined> = {}): FormValues {
  const values: FormValues = {}

  for (const section of sections) {
    const existing = existingValuesByPrefix[section.prefix]
    for (const { fieldKey, property } of getResolvedSchemaFields(section.schema)) {
      const fieldName = `${section.prefix}${fieldKey}`
      const existingValue = existing?.[fieldKey]

      if (existingValue !== undefined && existingValue !== null) {
        if (property.type === 'array' && Array.isArray(existingValue)) {
          values[fieldName] = existingValue.join('\n')
        } else if (property.type === 'boolean') {
          values[fieldName] = Boolean(existingValue)
        } else {
          values[fieldName] = String(existingValue)
        }
        continue
      }

      if (property.generate === true) {
        values[fieldName] = `openlane-${crypto.randomUUID()}`
        continue
      }

      if (property.default !== undefined) {
        if (property.type === 'array' && Array.isArray(property.default)) {
          values[fieldName] = property.default.join('\n')
        } else if (property.type === 'boolean') {
          values[fieldName] = Boolean(property.default)
        } else {
          values[fieldName] = String(property.default)
        }
        continue
      }

      if (property.type === 'boolean') {
        values[fieldName] = false
        continue
      }

      values[fieldName] = ''
    }
  }

  return values
}

export function buildZodSchema(sections: SchemaSection[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const section of sections) {
    for (const { fieldKey, property, required } of getResolvedSchemaFields(section.schema)) {
      const fieldName = `${section.prefix}${fieldKey}`
      shape[fieldName] = buildFieldSchema(fieldKey, property, required)
    }
  }

  return z.object(shape)
}

export function normalizeIntegrationFormPayloads(
  credentialSchema: IntegrationSchemaNode | undefined,
  userInputSchema: IntegrationSchemaNode | undefined,
  values: FormValues,
): NormalizedIntegrationFormPayloads {
  const credentialPayload = normalizeSectionPayload(credentialSchema, values, CREDENTIALS_PREFIX)
  const userInputPayload = normalizeSectionPayload(userInputSchema, values, USER_INPUT_PREFIX)

  return {
    credentialPayload,
    hasCredentialPayload: Object.keys(credentialPayload.payload).length > 0,
    hasUserInputPayload: Object.keys(userInputPayload.payload).length > 0,
    missingRequired: [...credentialPayload.missingRequired, ...userInputPayload.missingRequired],
    userInputPayload,
  }
}

export function normalizeSectionPayload(schema: IntegrationSchemaNode | undefined, values: FormValues, prefix: string): { payload: Record<string, unknown>; missingRequired: string[] } {
  const payload: Record<string, unknown> = {}
  const missingRequired: string[] = []

  for (const { fieldKey, nestedPath, property, required } of getResolvedSchemaFields(schema)) {
    const rawValue = values[`${prefix}${fieldKey}`]

    switch (property.type) {
      case 'boolean':
        setNestedValue(payload, nestedPath, Boolean(rawValue))
        continue
      case 'array': {
        const list = String(rawValue ?? '')
          .split(/[\n,]+/)
          .map((value) => value.trim())
          .filter(Boolean)

        if (list.length > 0) {
          setNestedValue(payload, nestedPath, list)
        } else if (required) {
          missingRequired.push(property.title || fieldKey)
        }
        continue
      }
      case 'integer': {
        const parsed = Number.parseInt(String(rawValue ?? ''), 10)
        if (!Number.isNaN(parsed)) {
          setNestedValue(payload, nestedPath, parsed)
        } else if (required) {
          missingRequired.push(property.title || fieldKey)
        }
        continue
      }
      case 'number': {
        const parsed = Number.parseFloat(String(rawValue ?? ''))
        if (!Number.isNaN(parsed)) {
          setNestedValue(payload, nestedPath, parsed)
        } else if (required) {
          missingRequired.push(property.title || fieldKey)
        }
        continue
      }
      default: {
        const trimmed = String(rawValue ?? '').trim()
        if (trimmed.length > 0) {
          setNestedValue(payload, nestedPath, trimmed)
        } else if (required) {
          missingRequired.push(property.title || fieldKey)
        }
      }
    }
  }

  return { payload, missingRequired }
}

export function isSensitiveField(fieldKey: string, property: IntegrationSchemaProperty): boolean {
  if (property.format === 'password' || property.secret) {
    return true
  }

  const normalized = `${fieldKey}${property.title ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '')

  if (normalized.includes('accesskeyid')) {
    return false
  }

  return ['password', 'secret', 'token', 'clientsecret', 'privatekey', 'serviceaccountkey'].some((token) => normalized.includes(token))
}

export function getResolvedSchemaFields(schema?: IntegrationSchemaNode): ResolvedSchemaField[] {
  const registry = schema?.$defs ?? schema?.definitions ?? {}
  return resolveFields(schema, registry, [], undefined)
}

function resolveFields(schema: IntegrationSchemaNode | undefined, registry: Record<string, IntegrationSchemaNode>, parentPath: string[], groupLabel: string | undefined): ResolvedSchemaField[] {
  const requiredFields = collectRequiredSchemaFields(schema)

  return Object.entries(schema?.properties ?? {}).flatMap(([fieldKey, rawProperty]) => {
    const property = resolveSchemaNode(rawProperty, registry) as IntegrationSchemaProperty | undefined

    if (!property || property.readOnly || property.readonly || property.const !== undefined) {
      return []
    }

    const currentPath = [...parentPath, fieldKey]

    if (property.properties) {
      const nestedGroupLabel = property.title?.trim() || toHumanLabel(fieldKey)
      return resolveFields(property, registry, currentPath, nestedGroupLabel)
    }

    return [{ fieldKey: currentPath.join('__'), nestedPath: currentPath, groupLabel, property, required: requiredFields.has(fieldKey) }]
  })
}

export function inferInputType(fieldKey: string, property: IntegrationSchemaProperty): string {
  if (property.type === 'number' || property.type === 'integer') {
    return 'number'
  }

  if (isSensitiveField(fieldKey, property)) {
    return 'password'
  }

  switch (property.format) {
    case 'email':
      return 'email'
    case 'uri':
    case 'url':
      return 'url'
    default:
      return 'text'
  }
}

export function shouldRenderAsTextarea(fieldKey: string, property: IntegrationSchemaProperty): boolean {
  if (property.type !== 'string') {
    return false
  }

  const normalized = `${fieldKey}${property.title ?? ''}${property.description ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '')

  return normalized.includes('json') || normalized.includes('certificate')
}

function buildFieldSchema(fieldKey: string, property: IntegrationSchemaProperty, required: boolean): z.ZodTypeAny {
  const label = property.title?.trim() || toHumanLabel(fieldKey)

  if (property.type === 'boolean') {
    return z.boolean()
  }

  if (property.type === 'number' || property.type === 'integer') {
    return buildNumericSchema(label, property, required)
  }

  let schema: z.ZodTypeAny = required ? z.string().min(1, `${label} is required`) : z.string()

  if (Array.isArray(property.enum) && property.enum.length > 0) {
    const options = property.enum.map(String)
    schema = schema.refine((value) => (!required && value === '') || options.includes(value), `${label} must be one of ${options.join(', ')}`)
  }

  if (property.format === 'email') {
    schema = schema.refine((value) => (!required && value === '') || EMAIL_SCHEMA.safeParse(value).success, 'Please enter a valid email address')
  }

  if (property.format === 'uri' || property.format === 'url') {
    schema = schema.refine((value) => (!required && value === '') || URL_SCHEMA.safeParse(value).success, 'Please enter a valid URL')
  }

  if (typeof property.minLength === 'number') {
    const minLength = property.minLength
    schema = schema.refine((value) => (!required && value === '') || value.length >= minLength, `${label} must be at least ${minLength} characters`)
  }

  if (typeof property.maxLength === 'number') {
    const maxLength = property.maxLength
    schema = schema.refine((value) => value.length <= maxLength, `${label} must be at most ${maxLength} characters`)
  }

  const pattern = safePattern(property.pattern)
  if (pattern) {
    schema = schema.refine((value) => (!required && value === '') || pattern.test(value), `${label} is invalid`)
  }

  return schema
}

function buildNumericSchema(label: string, property: IntegrationSchemaProperty, required: boolean) {
  let schema =
    property.type === 'integer'
      ? z
          .number({
            invalid_type_error: `${label} must be a whole number`,
            required_error: `${label} is required`,
          })
          .int(`${label} must be a whole number`)
      : z.number({
          invalid_type_error: `${label} must be a number`,
          required_error: `${label} is required`,
        })

  if (typeof property.minimum === 'number') {
    schema = schema.min(property.minimum, `${label} must be at least ${property.minimum}`)
  }

  if (typeof property.maximum === 'number') {
    schema = schema.max(property.maximum, `${label} must be at most ${property.maximum}`)
  }

  return z.preprocess(
    (rawValue) => {
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        return undefined
      }

      if (typeof rawValue === 'number') {
        return rawValue
      }

      const parsed = property.type === 'integer' ? Number.parseInt(String(rawValue), 10) : Number.parseFloat(String(rawValue))

      return Number.isNaN(parsed) ? rawValue : parsed
    },
    required ? schema : schema.optional(),
  )
}

function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[path[path.length - 1]] = value
}

function safePattern(pattern?: string): RegExp | undefined {
  if (!pattern) {
    return undefined
  }

  try {
    return new RegExp(pattern)
  } catch {
    return undefined
  }
}
