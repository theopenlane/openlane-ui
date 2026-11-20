import { isEmptyInputValue } from '@/hooks/useDirtyInput'
import { isDeepEqual } from '@/utils/input-diff'

type TConfigData = Record<string, unknown>

const comparable = (value: unknown) => (isEmptyInputValue(value) ? undefined : value)

export const isFieldAtDefault = (data: TConfigData, defaults: TConfigData, field: string): boolean => isDeepEqual(comparable(data[field]), comparable(defaults[field]))

export const resetFieldsToDefault = (data: TConfigData, defaults: TConfigData, fields: string[]): TConfigData => {
  const next = { ...data }
  fields.forEach((field) => {
    if (isEmptyInputValue(defaults[field])) {
      delete next[field]
    } else {
      next[field] = structuredClone(defaults[field])
    }
  })
  return next
}
