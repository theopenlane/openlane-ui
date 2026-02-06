import type { WhereCondition } from '@/types'

const isGroupCondition = (condition?: WhereCondition): condition is { and: WhereCondition[] } => {
  return Boolean(condition && 'and' in condition && Array.isArray(condition.and))
}

export const extractFilterValues = (condition?: WhereCondition): Record<string, unknown> => {
  if (!condition) return {}

  if (isGroupCondition(condition)) {
    return condition.and.reduce<Record<string, unknown>>((acc, entry) => {
      Object.entries(entry as Record<string, unknown>).forEach(([key, value]) => {
        if (key !== 'and' && key !== 'or') acc[key] = value
      })
      return acc
    }, {})
  }

  return Object.entries(condition as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key !== 'and' && key !== 'or') acc[key] = value
    return acc
  }, {})
}
