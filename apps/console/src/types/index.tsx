import { type LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  addCount?: boolean
  href: string
  icon?: LucideIcon
  isChildren?: boolean
  children?: NavItem[]
}

export interface Separator {
  type: 'separator'
}

export interface NavHeading {
  type: 'heading'
  heading: string
}

// Define allowed filter types
export type FilterType = 'text' | 'number' | 'select' | 'selectIs' | 'date' | 'boolean' | 'containsText'

// Define a common interface for filter fields
export interface FilterFieldBase {
  key: string
  label: string
  type: FilterType
}

// Specialized interface for fields with options (for select inputs)
export interface SelectFilterField extends FilterFieldBase {
  type: 'select'
  options: { value: string; label: string }[]
}

export interface SelectIsFilterField extends FilterFieldBase {
  type: 'selectIs'
  options: { value: string; label: string }[]
}

// General interface for other field types (text, number, date, boolean)
export interface StandardFilterField extends FilterFieldBase {
  type: Exclude<FilterType, 'select'>
  options?: never
}

// Union type for all possible filter fields
export type FilterField = SelectFilterField | StandardFilterField | SelectIsFilterField

// Filter definition
export type Filter = {
  field: string
  value: any
  type: FilterType
  operator: string
}

export type Condition = {
  [field: string]: string | number | boolean | { [operator: string]: string | number }
}

export type WhereCondition =
  | {
      and?: Condition[]
      or?: Condition[]
    }
  | Condition

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
}
