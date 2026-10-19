import { z } from 'zod'
import { isValidEmail } from '@/lib/validators'

export const responsibilityChoiceSchema = z.object({
  type: z.enum(['user', 'group', 'personnel', 'string']),
  value: z.string(),
  displayName: z.string().optional(),
  noClearOtherFields: z.boolean().optional(),
})

export const responsibilityFieldSchema = responsibilityChoiceSchema.optional().nullable()

export type ResponsibilitySelection = z.infer<typeof responsibilityFieldSchema>

export type ResponsibilityChoice = z.infer<typeof responsibilityChoiceSchema>

export type TResponsibilityCustomValue = 'email' | 'text'

type TResponsibilityCustomValueRule = {
  noun: string
  inputHint: string
  validation?: { isValid: (value: string) => boolean; title: string; description: string }
}

const RESPONSIBILITY_CUSTOM_VALUE_RULES: Record<TResponsibilityCustomValue, TResponsibilityCustomValueRule> = {
  email: {
    noun: 'email',
    inputHint: 'a name/email',
    validation: { isValid: isValidEmail, title: 'Invalid email', description: 'Custom values must be a valid email address' },
  },
  text: { noun: 'value', inputHint: 'a custom value' },
}

export const getResponsibilitySearchPlaceholder = (kind: TResponsibilityCustomValue, withPersonnel: boolean) =>
  `Search users, groups${withPersonnel ? ', personnel' : ''}, or type ${RESPONSIBILITY_CUSTOM_VALUE_RULES[kind].inputHint}...`

export const getCustomValueLabel = (kind: TResponsibilityCustomValue, term: string) => `Use "${term}" as custom ${RESPONSIBILITY_CUSTOM_VALUE_RULES[kind].noun}`

export const getCustomValueError = (kind: TResponsibilityCustomValue, selection: ResponsibilitySelection) => {
  const { validation } = RESPONSIBILITY_CUSTOM_VALUE_RULES[kind]
  if (selection?.type !== 'string' || !validation || validation.isValid(selection.value)) {
    return null
  }
  return { title: validation.title, description: validation.description }
}

export interface ResponsibilityFieldInput {
  user?: { id?: string; displayName?: string } | null
  group?: { id?: string; displayName?: string } | null
  personnel?: { id?: string; fullName?: string | null; email?: string | null } | null
  personnelID?: string | null
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

  const personnelID = input.personnel?.id || input.personnelID
  if (personnelID) {
    return { type: 'personnel', value: personnelID, displayName: input.personnel?.fullName || input.personnel?.email || personnelID }
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

export type ResponsibilityInputKeys<B extends string, S extends string> =
  `${B}UserID` | `${B}GroupID` | `${B}IdentityHolderID` | S | `clear${Capitalize<B>}User` | `clear${Capitalize<B>}Group` | `clear${Capitalize<B>}IdentityHolder` | `clear${Capitalize<S>}`

export interface ResponsibilityTarget {
  fieldBaseName: string
  stringFieldName: string
}

export const responsibilityTargetFor =
  <TInput>() =>
  <const B extends string, const S extends string = B>(fieldBaseName: ResponsibilityInputKeys<B, S> extends keyof TInput ? B : never, stringFieldName?: S): ResponsibilityTarget => ({
    fieldBaseName,
    stringFieldName: stringFieldName ?? fieldBaseName,
  })

interface ResponsibilityPayloadOptions {
  mode?: ResponsibilityPayloadMode
  allowPersonnel?: boolean
  stringFieldName?: string
}

function getClearFieldNames(fieldBaseName: string, stringFieldName: string): { clearUser: string; clearGroup: string; clearString: string; clearPersonnel: string } {
  return {
    clearPersonnel: `clear${capitalize(fieldBaseName)}IdentityHolder`,
    clearUser: `clear${capitalize(fieldBaseName)}User`,
    clearGroup: `clear${capitalize(fieldBaseName)}Group`,
    clearString: `clear${capitalize(stringFieldName)}`,
  }
}

export function buildResponsibilityPayload(
  fieldBaseName: string,
  selection: ResponsibilitySelection,
  { mode = 'create', allowPersonnel = true, stringFieldName = fieldBaseName }: ResponsibilityPayloadOptions = {},
): Record<string, string | boolean | undefined> {
  if (mode === 'update') {
    const { clearUser, clearGroup, clearString, clearPersonnel } = getClearFieldNames(fieldBaseName, stringFieldName)
    const clearPersonnelFields = allowPersonnel ? { [clearPersonnel]: true } : {}

    if (!selection) {
      return {
        ...clearPersonnelFields,
        [clearUser]: true,
        [clearGroup]: true,
        [clearString]: true,
      }
    }

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
          ...clearPersonnelFields,
          [`${fieldBaseName}UserID`]: selection.value,
          [clearGroup]: true,
          [clearString]: true,
        }
      case 'group':
        return {
          [`${fieldBaseName}GroupID`]: selection.value,
          ...clearPersonnelFields,
          [clearUser]: true,
          [clearString]: true,
        }
      case 'personnel':
        return { [`${fieldBaseName}IdentityHolderID`]: selection.value, [clearUser]: true, [clearGroup]: true, [clearString]: true }
      case 'string':
        return {
          [stringFieldName]: selection.value,
          ...clearPersonnelFields,
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
    case 'personnel':
      return { [`${fieldBaseName}IdentityHolderID`]: selection.value }
    case 'string':
      return { [stringFieldName]: selection.value }
    default:
      return {}
  }
}

export const buildResponsibilityTargetPayload = (target: ResponsibilityTarget, selection: ResponsibilitySelection, { isCreate, isDirty }: { isCreate: boolean; isDirty: boolean }) => {
  if (!isCreate && !isDirty) return {}
  return buildResponsibilityPayload(target.fieldBaseName, selection, { mode: isCreate ? 'create' : 'update', stringFieldName: target.stringFieldName })
}

export function buildResponsibilityInlineUpdate(
  fieldBaseName: string,
  selection: ResponsibilitySelection,
  { allowPersonnel = true, stringFieldName }: ResponsibilityPayloadOptions = {},
): Record<string, string | boolean | undefined> {
  return buildResponsibilityPayload(fieldBaseName, selection, { mode: 'update', allowPersonnel, stringFieldName })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
