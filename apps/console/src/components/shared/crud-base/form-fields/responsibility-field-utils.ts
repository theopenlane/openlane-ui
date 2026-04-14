import { z } from 'zod'
import { isValidEmail } from '@/lib/validators'

export const responsibilityFieldSchema = z
  .object({
    type: z.enum(['user', 'group', 'string']),
    value: z.string(),
    displayName: z.string().optional(),
    noClearOtherFields: z.boolean().optional(), // for types that are update but do not have other fields to clear, like delegate in risks
  })
  .refine((data) => data.type !== 'string' || isValidEmail(data.value), {
    message: 'Must be a valid email address',
    path: ['value'],
  })
  .optional()
  .nullable()

export type ResponsibilitySelection = z.infer<typeof responsibilityFieldSchema>

export interface ResponsibilityFieldInput {
  user?: { id?: string; displayName?: string } | null
  group?: { id?: string; displayName?: string } | null
  userID?: string | null
  groupID?: string | null
  stringValue?: string | null
}

export function normalizeResponsibilityField(input: ResponsibilityFieldInput): ResponsibilitySelection {
  if (input.user?.id) {
    return {
      type: 'user',
      value: input.user.id,
      displayName: input.user.displayName ?? input.user.id,
    }
  }

  if (input.userID) {
    return {
      type: 'user',
      value: input.userID,
      displayName: input.userID,
    }
  }

  if (input.group?.id) {
    return {
      type: 'group',
      value: input.group.id,
      displayName: input.group.displayName ?? input.group.id,
    }
  }

  if (input.groupID) {
    return {
      type: 'group',
      value: input.groupID,
      displayName: input.groupID,
    }
  }

  if (input.stringValue) {
    return {
      type: 'string',
      value: input.stringValue,
      displayName: input.stringValue,
    }
  }

  return null
}

export function normalizeEntityData<T extends object>(data: T | null | undefined, responsibilityFields: Record<string, ResponsibilityFieldInput>) {
  const raw = Object.fromEntries(Object.entries(data ?? {}).map(([key, value]) => [key, value === null ? undefined : value]))
  const normalized = Object.fromEntries(Object.entries(responsibilityFields).map(([name, input]) => [name, normalizeResponsibilityField(input)]))
  return { ...raw, ...normalized }
}

type ResponsibilityPayloadMode = 'create' | 'update'

interface ResponsibilityPayloadOptions {
  mode?: ResponsibilityPayloadMode
}

function getClearFieldNames(fieldBaseName: string): { clearUser: string; clearGroup: string; clearString: string } {
  return {
    clearUser: `clear${capitalize(fieldBaseName)}User`,
    clearGroup: `clear${capitalize(fieldBaseName)}Group`,
    clearString: `clear${capitalize(fieldBaseName)}`,
  }
}

export function buildResponsibilityPayload(
  fieldBaseName: string,
  selection: ResponsibilitySelection,
  { mode = 'create' }: ResponsibilityPayloadOptions = {},
): Record<string, string | boolean | undefined> {
  if (mode === 'update') {
    const { clearUser, clearGroup, clearString } = getClearFieldNames(fieldBaseName)

    if (!selection) {
      return {
        [clearUser]: true,
        [clearGroup]: true,
        [clearString]: true,
      }
    }

    // clear just the single field, used by group and user only fields
    if (selection.value === '') {
      return {
        [clearString]: true,
      }
    }

    if (selection.noClearOtherFields) {
      return { [`${fieldBaseName}ID`]: selection.value }
    }

    switch (selection.type) {
      case 'user':
        return {
          [`${fieldBaseName}UserID`]: selection.value,
          [clearGroup]: true,
          [clearString]: true,
        }
      case 'group':
        return {
          [`${fieldBaseName}GroupID`]: selection.value,
          [clearUser]: true,
          [clearString]: true,
        }
      case 'string':
        return {
          [fieldBaseName]: selection.value,
          [clearUser]: true,
          [clearGroup]: true,
        }
      default:
        return {}
    }
  }

  if (!selection) {
    return {}
  }

  if (selection.noClearOtherFields) {
    return { [`${fieldBaseName}ID`]: selection.value }
  }

  switch (selection.type) {
    case 'user':
      return { [`${fieldBaseName}UserID`]: selection.value }
    case 'group':
      return { [`${fieldBaseName}GroupID`]: selection.value }
    case 'string':
      return { [fieldBaseName]: selection.value }
    default:
      return {}
  }
}

export function buildResponsibilityInlineUpdate(fieldBaseName: string, selection: ResponsibilitySelection): Record<string, string | boolean | undefined> {
  return buildResponsibilityPayload(fieldBaseName, selection, { mode: 'update' })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
