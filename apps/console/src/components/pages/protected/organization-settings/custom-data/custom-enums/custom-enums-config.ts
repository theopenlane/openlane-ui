import { CustomTypeEnumWhereInput } from '@repo/codegen/src/schema'
import {
  Drill,
  LucideIcon,
  Eye,
  CopyCheck,
  SlidersHorizontal,
  TriangleAlert,
  FolderOpen,
  Compass,
  ScrollText,
  FileText,
  Server,
  FolderTree,
  Folder,
  Globe2,
  Focus,
  ScanEye,
  EarthLock,
  Layers,
  CircleGauge,
  Blend,
  CircleDot,
  GitBranch,
} from 'lucide-react'

export type EnumGroupConfig = {
  label: string
  objectType?: string
  isGlobal?: boolean
  field?: string
  icon: LucideIcon
}

export const ENUM_GROUP_MAP: Record<string, EnumGroupConfig> = {
  'All Enums': {
    label: 'All Enums',
    icon: Eye,
  },
  Environments: {
    label: 'Environments',
    field: 'environment',
    objectType: 'global',
    isGlobal: true,
    icon: Globe2,
  },
  Scopes: {
    label: 'Scopes',
    field: 'scope',
    objectType: 'global',
    isGlobal: true,
    icon: Focus,
  },
  'Task Kinds': {
    label: 'Task Kinds',
    objectType: 'task',
    field: 'kind',
    icon: CopyCheck,
  },
  'Control Kinds': {
    label: 'Control Kinds',
    objectType: 'control',
    field: 'kind',
    icon: SlidersHorizontal,
  },
  'Risk Kinds': {
    label: 'Risk Kinds',
    objectType: 'risk',
    field: 'kind',
    icon: TriangleAlert,
  },
  'Risk Categories': {
    label: 'Risk Categories',
    objectType: 'risk',
    field: 'category',
    icon: FolderOpen,
  },
  'Program Kinds': {
    label: 'Program Kinds',
    objectType: 'program',
    field: 'kind',
    icon: Compass,
  },
  'Policy Kinds': {
    label: 'Policy Kinds',
    objectType: 'internal_policy',
    field: 'kind',
    icon: ScrollText,
  },
  'Procedure Kinds': {
    label: 'Procedure Kinds',
    objectType: 'procedure',
    field: 'kind',
    icon: Drill,
  },
  'Trust Center Doc Kinds': {
    label: 'Trust Center Doc Kinds',
    objectType: 'trust_center_doc',
    field: 'kind',
    icon: FileText,
  },
  'Trust Center Subprocessor Kinds': {
    label: 'Trust Center Subprocessor Kinds',
    objectType: 'trust_center_subprocessor',
    field: 'kind',
    icon: Server,
  },
  'Asset Subtypes': {
    label: 'Asset Subtypes',
    objectType: 'asset',
    field: 'subtype',
    icon: FolderTree,
  },
  'Data Classifications': {
    label: 'Data Classifications',
    objectType: 'asset',
    field: 'dataClassification',
    icon: Folder,
  },

  'Access Models': {
    label: 'Access Models',
    objectType: 'asset',
    field: 'accessModel',
    icon: ScanEye,
  },
  'Encryption Statuses': {
    label: 'Encryption Statuses',
    objectType: 'asset',
    field: 'encryptionStatus',
    icon: EarthLock,
  },
  'Security Tiers': {
    label: 'Security Tiers',
    objectType: 'asset',
    field: 'securityTier',
    icon: Layers,
  },
  'Criticality Levels': {
    label: 'Criticality Levels',
    objectType: 'asset',
    field: 'criticality',
    icon: CircleGauge,
  },
  'Relationship States': {
    label: 'Relationship States',
    objectType: 'entity',
    field: 'relationshipState',
    icon: Blend,
  },
  'Security Questionnaire Statuses': {
    label: 'Security Questionnaire Statuses',
    objectType: 'entity',
    field: 'securityQuestionnaireStatus',
    icon: CircleDot,
  },
  'Source Types': {
    label: 'Source Types',
    objectType: 'entity',
    field: 'sourceType',
    icon: GitBranch,
  },
}

export const ENUM_GROUPS = Object.keys(ENUM_GROUP_MAP)

export const getEnumFilter = (view: string, search: string): CustomTypeEnumWhereInput => {
  const filter: CustomTypeEnumWhereInput = { nameContainsFold: search }
  const config = ENUM_GROUP_MAP[view]

  if (!config || view === 'All Enums') return filter

  if (config.objectType) filter.objectType = config.objectType
  if (config.field) filter.field = config.field

  return filter
}
