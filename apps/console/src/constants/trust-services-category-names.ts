export const SOC_2_FRAMEWORK_NAME = 'SOC 2'

export const SOC_2_REQUIRED_CATEGORY = 'Security'

export const TRUST_SERVICES_CATEGORY_NAMES = [SOC_2_REQUIRED_CATEGORY, 'Availability', 'Confidentiality', 'Processing Integrity', 'Privacy'] as const

export type TTrustServicesCategoryName = (typeof TRUST_SERVICES_CATEGORY_NAMES)[number]
