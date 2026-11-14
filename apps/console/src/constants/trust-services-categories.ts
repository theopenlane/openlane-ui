import { BookLock, Cloud, GlobeLock, Shield, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { splitFrameworkNames } from '@/constants/standards'
import { SOC_2_FRAMEWORK_NAME, TRUST_SERVICES_CATEGORY_NAMES, type TTrustServicesCategoryName } from '@/constants/trust-services-category-names'

export type TTrustServicesCategory = {
  name: string
  description: string
  icon: LucideIcon
  criteriaPrefix: string
}

const TRUST_SERVICES_CATEGORY_DETAILS: Record<TTrustServicesCategoryName, Omit<TTrustServicesCategory, 'name'>> = {
  Security: { description: 'Protect systems and information against unauthorized access and disclosure.', icon: Shield, criteriaPrefix: 'CC' },
  Availability: { description: 'Systems are available for operation and use as committed.', icon: Cloud, criteriaPrefix: 'A' },
  Confidentiality: { description: 'Confidential information is protected according to your commitments.', icon: BookLock, criteriaPrefix: 'C' },
  'Processing Integrity': { description: 'Processing is complete, valid, accurate, timely, and authorized.', icon: SlidersHorizontal, criteriaPrefix: 'PI' },
  Privacy: { description: 'Personal information is collected, used, retained, and disclosed appropriately.', icon: GlobeLock, criteriaPrefix: 'P' },
}

export const TRUST_SERVICES_CATEGORIES: readonly TTrustServicesCategory[] = TRUST_SERVICES_CATEGORY_NAMES.map((name) => ({ name, ...TRUST_SERVICES_CATEGORY_DETAILS[name] }))

const CRITERIA_CODE_PATTERN = /^([A-Z]+)\d/

export const trustServicesCategoryForCriteria = (criteria: string): string | undefined => {
  const prefix = CRITERIA_CODE_PATTERN.exec(criteria.trim().toUpperCase())?.[1]
  return prefix ? TRUST_SERVICES_CATEGORIES.find((category) => category.criteriaPrefix === prefix)?.name : undefined
}

export const trustServicesCategoryForName = (name: string): string | undefined => {
  const normalized = name.trim().toLowerCase()
  return TRUST_SERVICES_CATEGORIES.find((category) => normalized.includes(category.name.toLowerCase()))?.name
}

const TRUST_SERVICES_CATEGORY_NAME_SET = new Set<string>(TRUST_SERVICES_CATEGORY_NAMES)

export const isTrustServicesCategory = (name: string): boolean => TRUST_SERVICES_CATEGORY_NAME_SET.has(name)

export const isSoc2Framework = (frameworkName?: string | null): boolean => splitFrameworkNames(frameworkName).some((name) => name.toLowerCase() === SOC_2_FRAMEWORK_NAME.toLowerCase())

export const sortTrustServicesCategories = (categories: string[]): string[] => [
  ...TRUST_SERVICES_CATEGORIES.filter((category) => categories.includes(category.name)).map((category) => category.name),
  ...categories.filter((category) => !isTrustServicesCategory(category)).sort((a, b) => a.localeCompare(b)),
]
