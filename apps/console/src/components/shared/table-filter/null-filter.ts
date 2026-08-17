import { type Condition } from '@/types'

export type TNullState = 'IsNil' | 'NotNil'

export type TNullFilterValue = { nullState: TNullState }

export const NULL_FILTER_OPTIONS: { value?: TNullState; label: string }[] = [{ label: 'Any' }, { value: 'IsNil', label: 'Not set' }, { value: 'NotNil', label: 'Set' }]

export const isNullFilterValue = (value: unknown): value is TNullFilterValue => {
  if (typeof value !== 'object' || value === null) return false
  const { nullState } = value as { nullState?: unknown }
  return nullState === 'IsNil' || nullState === 'NotNil'
}

export const getNullFilterCondition = (nullableKey: string, value: TNullFilterValue): Condition => ({ [`${nullableKey}${value.nullState}`]: true })
