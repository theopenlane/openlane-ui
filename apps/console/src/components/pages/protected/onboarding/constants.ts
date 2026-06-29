import { CreditCard, Ellipsis, Globe2, Heart, ShieldCheck } from 'lucide-react'

export const ONBOARDING_PROGRAM_ROUTES = {
  soc2: '/programs/create/soc2',
  frameworkBased: '/programs/create/framework-based',
  advancedSetup: '/programs/create/advanced-setup',
} as const

export const COMPLIANCE_FRAMEWORKS = {
  soc2: 'SOC 2',
  iso27001: 'ISO 27001',
  hipaa: 'HIPAA',
  pciDss: 'PCI DSS',
  nistCsf: 'NIST CSF',
  other: 'Other',
} as const

export const COMPLIANCE_FRAMEWORK_OPTIONS = [
  { value: COMPLIANCE_FRAMEWORKS.soc2, label: COMPLIANCE_FRAMEWORKS.soc2, icon: ShieldCheck },
  { value: COMPLIANCE_FRAMEWORKS.iso27001, label: COMPLIANCE_FRAMEWORKS.iso27001, icon: Globe2 },
  { value: COMPLIANCE_FRAMEWORKS.hipaa, label: COMPLIANCE_FRAMEWORKS.hipaa, icon: Heart },
  { value: COMPLIANCE_FRAMEWORKS.pciDss, label: COMPLIANCE_FRAMEWORKS.pciDss, icon: CreditCard },
  // NIST CSF for matching, but we display NIST in UI.
  { value: COMPLIANCE_FRAMEWORKS.nistCsf, label: 'NIST', icon: ShieldCheck },
  { value: COMPLIANCE_FRAMEWORKS.other, label: COMPLIANCE_FRAMEWORKS.other, icon: Ellipsis },
] as const
