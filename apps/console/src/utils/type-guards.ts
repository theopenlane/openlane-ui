export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

export const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: string): value is T =>
    (values as readonly string[]).includes(value)

export const isEnumValue = <T extends Record<string, string>>(enumObject: T, value: string): value is T[keyof T] => Object.values<string>(enumObject).includes(value)
