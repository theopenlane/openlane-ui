import { type LucideIcon } from 'lucide-react'
import { type ComponentType } from 'react'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { type ObjectTypes } from '@repo/codegen/src/type-names'

// nav icons are either plain lucide icons or self-animating icon components
// (see components/shared/icons/animated) which carry an `animated` marker
export type NavIcon = LucideIcon | (ComponentType<{ className?: string; size?: number }> & { animated?: boolean })

export interface NavItem {
  title: string
  addCount?: boolean
  href: string
  params?: string
  icon?: NavIcon
  isChildren?: boolean
  children?: NavItem[]
  hidden?: boolean
  plan?: PlanEnum | PlanEnum[]
  objectType?: ObjectTypes
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

export interface FilterField<K extends string = string> {
  key: K
  label: string
  icon: LucideIcon
  type:
    'text' | 'select' | 'date' | 'boolean' | 'dateRange' | 'sliderNumber' | 'sliderRange' | 'multiselect' | 'dropdownUserSearch' | 'radio' | 'dropdownSearchMultiselect' | 'dropdownSearchSingleSelect'
  options?: { value: string; label: string }[] //for select and multiselect types
  min?: number // for sliderNumber type
  max?: number // for sliderNumber type
  radioOptions?: { value: string | boolean | undefined; label: string }[] // Specific for tri-state/radio logic
  nullableKey?: string
}

export type WhereInputKey<TWhereInput> = Extract<keyof TWhereInput, string>

type SchemaFilterKey<TWhereInput> = WhereInputKey<TWhereInput>

type PairedBaseKey<TWhereInput, TLower extends string, TUpper extends string> = {
  [K in SchemaFilterKey<TWhereInput>]: K extends `${infer TBase}${TLower}` ? (`${TBase}${TUpper}` extends SchemaFilterKey<TWhereInput> ? TBase : never) : never
}[SchemaFilterKey<TWhereInput>]

export type DateFilterKey<TWhereInput> = PairedBaseKey<TWhereInput, 'GTE', 'LT'>
export type RangeFilterKey<TWhereInput> = PairedBaseKey<TWhereInput, 'GTE', 'LTE'>
export type NullableFilterKey<TWhereInput> = PairedBaseKey<TWhereInput, 'IsNil', 'NotNil'>

type FilterFieldShape<TWhereInput> = Omit<FilterField, 'key' | 'type' | 'nullableKey'> & {
  nullableKey?: NullableFilterKey<TWhereInput>
}

export type FilterFieldFor<TWhereInput, TSynthetic extends string = never> =
  | (FilterFieldShape<TWhereInput> & {
      type: 'text' | 'select' | 'boolean' | 'radio' | 'multiselect' | 'sliderNumber' | 'dropdownUserSearch' | 'dropdownSearchMultiselect' | 'dropdownSearchSingleSelect'
      key: SchemaFilterKey<TWhereInput> | TSynthetic
    })
  | (FilterFieldShape<TWhereInput> & {
      type: 'date' | 'dateRange'
      key: DateFilterKey<TWhereInput> | TSynthetic
    })
  | (FilterFieldShape<TWhereInput> & {
      type: 'sliderRange'
      key: RangeFilterKey<TWhereInput> | TSynthetic
    })

export const defineFilterFields =
  <TWhereInput, TSynthetic extends string = never>() =>
  <const TFields extends readonly FilterFieldFor<TWhereInput, TSynthetic>[]>(fields: TFields): TFields[number][] => [...fields]

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
  __typename?: 'Control' | 'Subcontrol'
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
