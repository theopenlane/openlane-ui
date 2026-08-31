import { type ControlWhereInput } from '@repo/codegen/src/schema'
import { isStringArray } from './filter-storage'

export const CUSTOM_STANDARD_FILTER_VALUE = 'CUSTOM'

export const CUSTOM_STANDARD_FILTER_OPTION = { value: CUSTOM_STANDARD_FILTER_VALUE, label: 'CUSTOM' } as const

export const isCustomStandardFilter = (key: string, value: unknown): value is string[] => key === 'standardIDIn' && isStringArray(value) && value.includes(CUSTOM_STANDARD_FILTER_VALUE)

export const buildCustomStandardFilterWhere = (values: string[]): ControlWhereInput => {
  const standardIDs = values.filter((id) => id !== CUSTOM_STANDARD_FILTER_VALUE)
  if (standardIDs.length === 0) {
    return { referenceFrameworkIsNil: true }
  }
  return { or: [{ standardIDIn: standardIDs }, { referenceFrameworkIsNil: true }] }
}
