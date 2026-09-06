import { type WhereCondition } from '@/types'
import { capitalizeFirstLetter, toTitleCase } from '@/utils/strings'

export const getAnyCasingCondition = (key: string, value: string): WhereCondition => {
  const lower = value.toLowerCase()
  const variants = [...new Set([value, lower, capitalizeFirstLetter(lower), toTitleCase(lower), lower.toUpperCase()])]

  return { or: variants.map((variant) => ({ [key]: variant })) }
}
