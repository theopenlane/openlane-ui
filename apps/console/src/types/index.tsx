import { type LucideIcon } from 'lucide-react'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export interface NavItem {
  title: string
  addCount?: boolean
  href: string
  params?: string
  icon?: LucideIcon
  isChildren?: boolean
  children?: NavItem[]
  hidden?: boolean
  plan?: PlanEnum
}

export interface Separator {
  type: 'separator'
  hidden?: boolean
}

export interface NavHeading {
  type: 'heading'
  heading: string
  hidden?: boolean
}

export interface FilterField {
  key: string
  label: string
  icon: LucideIcon
  type: 'text' | 'select' | 'date' | 'boolean' | 'dateRange' | 'sliderNumber' | 'multiselect' | 'dropdownSearch' | 'radio'
  options?: { value: string; label: string }[] //for select and multiselect types
  min?: number // for sliderNumber type
  max?: number // for sliderNumber type
  radioOptions?: { value: string | boolean | undefined; label: string }[] // Specific for tri-state/radio logic
}

export type ConditionValue =
  | string
  | number
  | boolean
  | { [operator: string]: string | number }
  | ConditionValue[] // recursively allow arrays
  | { [field: string]: ConditionValue[] }

export type Condition = {
  [field: string]: ConditionValue
}

export type WhereCondition = Condition | { and: WhereCondition[] } | { or: WhereCondition[] }

export type RoutePage = {
  route: string
  name: string
  keywords?: string[]
  hidden?: undefined
}

export type MapControl = {
  __typename?: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  id: string
  refCode: string
  category?: string | null
  subcategory?: string | null
  referenceFramework?: string | null
  controlID?: string | null
}

type GraphQLErrorItem = {
  message: string
  path?: Array<string | number>
  extensions?: {
    code?: string
    exception?: {
      stacktrace?: string[]
      name?: string
    }
    [ext: string]: unknown
  }
}

export type GqlError = {
  graphQLErrors?: GraphQLErrorItem[]
  networkError?: {
    message: string
    name?: string
    stack?: string
  }
}
