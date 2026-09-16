import { CircleDot, Shapes, UserRoundPen } from 'lucide-react'
import { type Condition, type ConditionValue, type FilterField, type WhereCondition } from '@/types'
import { type TQuickFilter, toDayStartIso } from '@/components/shared/table-filter/table-filter-helper'
import { enumValuesToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type WorkObjectType, WORK_OBJECT_TYPE_ORDER } from './work-item'
import { OUTSTANDING_WORK_STATUSES, type WorkStatus, WORK_STATUS_ORDER } from './work-status'

export const PROGRAM_WORK_FILTER_KEYS = {
  workStatus: 'workStatusIn',
  objectType: 'objectTypeIn',
  owner: 'ownerIDIn',
} as const

export const PROGRAM_WORK_QUICK_FILTER_KEYS = {
  myWork: 'myWork',
  overdue: 'overdue',
} as const

export type TProgramWorkFilters = {
  workStatusIn: WorkStatus[]
  objectTypeIn: WorkObjectType[]
  ownerIDIn: string[]
  overdueOnly: boolean
}

export const getProgramWorkFilterFields = (ownerOptions: { value: string; label: string }[], objectTypes: readonly WorkObjectType[]): FilterField[] => [
  {
    key: PROGRAM_WORK_FILTER_KEYS.workStatus,
    label: 'Status',
    type: 'multiselect',
    icon: CircleDot,
    options: enumValuesToOptions(WORK_STATUS_ORDER),
  },
  {
    key: PROGRAM_WORK_FILTER_KEYS.objectType,
    label: 'Object type',
    type: 'multiselect',
    icon: Shapes,
    options: enumValuesToOptions(objectTypes),
  },
  {
    key: PROGRAM_WORK_FILTER_KEYS.owner,
    label: 'Owner',
    type: 'dropdownSearchMultiselect',
    icon: UserRoundPen,
    options: ownerOptions,
  },
]

export const getProgramWorkQuickFilters = (userId?: string): TQuickFilter[] => [
  ...(userId
    ? [
        {
          label: 'My Work',
          key: PROGRAM_WORK_QUICK_FILTER_KEYS.myWork,
          type: 'custom' as const,
          getCondition: () => ({ [PROGRAM_WORK_FILTER_KEYS.owner]: [userId] }),
          isActive: false,
        },
      ]
    : []),
  {
    label: 'Overdue tasks',
    key: PROGRAM_WORK_QUICK_FILTER_KEYS.overdue,
    type: 'custom',
    getCondition: () => ({ [PROGRAM_WORK_QUICK_FILTER_KEYS.overdue]: true }),
    isActive: false,
  },
]

const flattenConditions = (where: WhereCondition | null | undefined): Condition => {
  if (!where) return {}

  const group = where as { and?: WhereCondition[]; or?: WhereCondition[] }
  const nested = [...(Array.isArray(group.and) ? group.and : []), ...(Array.isArray(group.or) ? group.or : [])]

  if (nested.length === 0) return where as Condition

  return nested.reduce<Condition>((acc, condition) => ({ ...acc, ...flattenConditions(condition) }), {})
}

const asStringArray = <TValue extends string>(value: ConditionValue | undefined, allowed: readonly TValue[]): TValue[] => {
  if (!Array.isArray(value)) return []
  const allowedSet = new Set<string>(allowed)
  return value.filter((entry): entry is TValue => typeof entry === 'string' && allowedSet.has(entry))
}

export const parseProgramWorkFilters = (where: WhereCondition | null): TProgramWorkFilters => {
  const conditions = flattenConditions(where)
  const workStatusIn = asStringArray(conditions[PROGRAM_WORK_FILTER_KEYS.workStatus], WORK_STATUS_ORDER)
  const objectTypeIn = asStringArray(conditions[PROGRAM_WORK_FILTER_KEYS.objectType], WORK_OBJECT_TYPE_ORDER)
  const ownerValue = conditions[PROGRAM_WORK_FILTER_KEYS.owner]

  return {
    workStatusIn: workStatusIn.length > 0 ? workStatusIn : [...OUTSTANDING_WORK_STATUSES],
    objectTypeIn: objectTypeIn.length > 0 ? objectTypeIn : [...WORK_OBJECT_TYPE_ORDER],
    ownerIDIn: Array.isArray(ownerValue) ? ownerValue.filter((entry): entry is string => typeof entry === 'string') : [],
    overdueOnly: conditions[PROGRAM_WORK_QUICK_FILTER_KEYS.overdue] === true,
  }
}

export const getOverdueBefore = (): string => toDayStartIso(new Date())
