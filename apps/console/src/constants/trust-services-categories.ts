import { BookLock, Cloud, GlobeLock, Shield, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { splitFrameworkNames } from '@/constants/standards'

export const SOC_2_FRAMEWORK_NAME = 'SOC 2'

export const SOC_2_REQUIRED_CATEGORY = 'Security'

export type TTrustServicesCategory = {
  name: string
  description: string
  icon: LucideIcon
}

export const TRUST_SERVICES_CATEGORIES: readonly TTrustServicesCategory[] = [
  { name: SOC_2_REQUIRED_CATEGORY, description: 'Protect systems and information against unauthorized access and disclosure.', icon: Shield },
  { name: 'Availability', description: 'Systems are available for operation and use as committed.', icon: Cloud },
  { name: 'Confidentiality', description: 'Confidential information is protected according to your commitments.', icon: BookLock },
  { name: 'Processing Integrity', description: 'Processing is complete, valid, accurate, timely, and authorized.', icon: SlidersHorizontal },
  { name: 'Privacy', description: 'Personal information is collected, used, retained, and disclosed appropriately.', icon: GlobeLock },
]

const TRUST_SERVICES_CATEGORY_NAMES = new Set(TRUST_SERVICES_CATEGORIES.map((category) => category.name))

export const isTrustServicesCategory = (name: string): boolean => TRUST_SERVICES_CATEGORY_NAMES.has(name)

export const isSoc2Framework = (frameworkName?: string | null): boolean => splitFrameworkNames(frameworkName).some((name) => name.toLowerCase() === SOC_2_FRAMEWORK_NAME.toLowerCase())

export const sortTrustServicesCategories = (categories: string[]): string[] => [
  ...TRUST_SERVICES_CATEGORIES.filter((category) => categories.includes(category.name)).map((category) => category.name),
  ...categories.filter((category) => !isTrustServicesCategory(category)).sort((a, b) => a.localeCompare(b)),
]
