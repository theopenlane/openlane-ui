import { CalendarClock, CircleDot, Shapes, UserRoundPen } from 'lucide-react'
import { type Condition, type ConditionValue, type FilterField, type WhereCondition } from '@/types'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { type TQuickFilter, toDayStartIso } from '@/components/shared/table-filter/table-filter-helper'
import { enumValuesToOptions } from '@/components/shared/enum-mapper/common-enum'
import { workObjectTypePluralLabel, WORK_OBJECT_TYPE_ORDER, type TWorkObjectType } from './work-item'
import { OUTSTANDING_WORK_STATUSES, type WorkStatus, WORK_STATUS_ORDER } from './work-status'

export const PROGRAM_WORK_FILTER_KEYS = {
  workStatus: 'workStatusIn',
  objectType: 'objectTypeIn',
  owner: 'ownerIDIn',
  overdue: 'overdue',
} as const

export const PROGRAM_WORK_QUICK_FILTER_KEYS = {
  myWork: 'myWork',
  overdue: 'overdueTasks',
} as const

export type TProgramWorkFilters = {
  workStatusIn: WorkStatus[]
  objectTypeIn: TWorkObjectType[]
  ownerIDIn: string[]
  overdueOnly: boolean
}

export const getProgramWorkFilterFields = (ownerOptions: { value: string; label: string }[], objectTypes: readonly TWorkObjectType[]): FilterField[] => [
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
    options: objectTypes.map((objectType) => ({ value: objectType, label: workObjectTypePluralLabel(objectType) })),
  },
  {
    key: PROGRAM_WORK_FILTER_KEYS.owner,
    label: 'Owner',
    type: 'dropdownSearchMultiselect',
    icon: UserRoundPen,
    options: ownerOptions,
  },
  {
    key: PROGRAM_WORK_FILTER_KEYS.overdue,
    label: 'Overdue tasks only',
    type: 'boolean',
    icon: CalendarClock,
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
    getCondition: () => ({ [PROGRAM_WORK_FILTER_KEYS.overdue]: true }),
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
  const ownerValue = conditions[PROGRAM_WORK_FILTER_KEYS.owner]

  return {
    workStatusIn: workStatusIn.length > 0 ? workStatusIn : [...OUTSTANDING_WORK_STATUSES],
    objectTypeIn: asStringArray(conditions[PROGRAM_WORK_FILTER_KEYS.objectType], WORK_OBJECT_TYPE_ORDER),
    ownerIDIn: Array.isArray(ownerValue) ? ownerValue.filter((entry): entry is string => typeof entry === 'string') : [],
    overdueOnly: conditions[PROGRAM_WORK_FILTER_KEYS.overdue] === true,
  }
}

export const toProgramWorkFilterState = (where: WhereCondition | null): TFilterState => {
  const conditions = flattenConditions(where)
  const workStatusIn = asStringArray(conditions[PROGRAM_WORK_FILTER_KEYS.workStatus], WORK_STATUS_ORDER)
  const objectTypeIn = asStringArray(conditions[PROGRAM_WORK_FILTER_KEYS.objectType], WORK_OBJECT_TYPE_ORDER)
  const ownerValue = conditions[PROGRAM_WORK_FILTER_KEYS.owner]
  const ownerIDIn = Array.isArray(ownerValue) ? ownerValue.filter((entry): entry is string => typeof entry === 'string') : []

  return {
    ...(workStatusIn.length > 0 ? { [PROGRAM_WORK_FILTER_KEYS.workStatus]: workStatusIn } : {}),
    ...(objectTypeIn.length > 0 ? { [PROGRAM_WORK_FILTER_KEYS.objectType]: objectTypeIn } : {}),
    ...(ownerIDIn.length > 0 ? { [PROGRAM_WORK_FILTER_KEYS.owner]: ownerIDIn } : {}),
    ...(conditions[PROGRAM_WORK_FILTER_KEYS.overdue] === true ? { [PROGRAM_WORK_FILTER_KEYS.overdue]: true } : {}),
  }
}

export const getOverdueBefore = (): string => toDayStartIso(new Date())
