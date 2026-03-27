import {
  type LucideIcon,
  Scale,
  Building2,
  ShieldHalf,
  Link,
  Database,
  LockKeyhole,
  BookText,
  FileLock,
  Server,
  Activity,
  Siren,
  RefreshCcw,
  Eye,
  Users,
  Workflow,
  Globe,
  FileCheck,
  Settings,
  ShieldCheck,
} from 'lucide-react'

const categoryIconMap: Record<string, LucideIcon> = {
  'Governance & Policy': Scale,
  'Organizational Context': Building2,
  'Risk Management': ShieldHalf,
  'Supply Chain Security': Link,
  'Asset Management': Database,
  'Access Control': LockKeyhole,
  'Security Awareness & Training': BookText,
  'Data Security': FileLock,
  'Platform & Infrastructure Security': Server,
  'Continuous Monitoring': Activity,
  'Incident Response': Siren,
  Resilience: RefreshCcw,
  'Privacy & Compliance': Eye,
  'Identity Management': Users,
  'Change Management': Workflow,
  'Network Security': Globe,
  'Audit & Assurance': FileCheck,
  'Configuration Management': Settings,
  'Vulnerability Management': ShieldCheck,
}

const DEFAULT_ICON: LucideIcon = ShieldCheck

export function getControlCategoryIcon(category: string): LucideIcon {
  return categoryIconMap[category] || DEFAULT_ICON
}

type ControlCategoryIconProps = {
  category: string
  size?: number
  className?: string
}

export function ControlCategoryIcon({ category, size = 20, className }: ControlCategoryIconProps) {
  const Icon = getControlCategoryIcon(category)
  return <Icon size={size} className={className} />
}
