import { isRecord } from '@/utils/type-guards'

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

export const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]))
  }

  if (isPlainRecord(a) && isPlainRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].every((key) => isDeepEqual(a[key], b[key]))
  }

  return false
}

export const diffBuiltInput = <TInput extends object>(current: TInput, baseline: TInput | undefined): Partial<TInput> => {
  const baselineInput = new Map<string, unknown>(Object.entries(baseline ?? {}))

  return Object.fromEntries(Object.entries(current).filter(([key, value]) => value !== undefined && !isDeepEqual(value, baselineInput.get(key)))) as Partial<TInput>
}

export const hasInputChanges = <TInput extends object>(current: TInput, baseline: TInput | undefined): boolean => Object.keys(diffBuiltInput(current, baseline)).length > 0
