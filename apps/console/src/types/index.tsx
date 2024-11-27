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
