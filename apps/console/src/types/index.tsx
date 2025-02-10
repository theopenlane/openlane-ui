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
export type FilterType = 'text' | 'number' | 'select' | 'date' | 'boolean'

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

// General interface for other field types (text, number, date, boolean)
export interface StandardFilterField extends FilterFieldBase {
  type: Exclude<FilterType, 'select'>
  options?: never
}

// Union type for all possible filter fields
export type FilterField = SelectFilterField | StandardFilterField

// Filter definition
export type Filter = {
  id: string
  field: string
  value: any
  type: FilterType
  operator: string
}
