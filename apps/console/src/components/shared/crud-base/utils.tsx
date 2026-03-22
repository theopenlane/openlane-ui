import { ObjectTypes } from '@repo/codegen/src/type-names'

// converts an enum to an array of { key, label } objects with human-friendly labels.
export function enumToSortFields<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((key) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }))
}

export type PermissionStrategy = 'object' | 'org'

const ORG_LEVEL_TYPES: ObjectTypes[] = [ObjectTypes.CONTACT, ObjectTypes.SCAN]

export const getPermissionStrategy = (objectType: ObjectTypes): PermissionStrategy => {
  return ORG_LEVEL_TYPES.includes(objectType) ? 'org' : 'object'
}
