import { type CustomTypeEnumWhereInput } from '@repo/codegen/src/schema'
import { FILE_CATEGORY_ENUM, GLOBAL_ENUM_FIELD, GLOBAL_ENUM_OBJECT_TYPE } from '@/lib/graphql-hooks/custom-type-enum'
import {
  Drill,
  type LucideIcon,
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
  ShieldAlert,
  SearchCheck,
  Files,
} from 'lucide-react'

export type EnumGroupConfig = {
  label: string
  objectType?: string
  field?: string
  icon: LucideIcon
}

export const GLOBAL_ENUM_GROUP = 'global'

export const isGlobalEnumGroup = (config?: EnumGroupConfig) => config?.objectType === GLOBAL_ENUM_GROUP

export const toApiObjectType = (objectType: string) => (objectType === GLOBAL_ENUM_GROUP ? GLOBAL_ENUM_OBJECT_TYPE : objectType)

export const fromApiObjectType = (objectType?: string | null) => objectType || GLOBAL_ENUM_GROUP

export const ENUM_GROUP_MAP: Record<string, EnumGroupConfig> = {
  'All Enums': {
    label: 'All Enums',
    icon: Eye,
  },
  Environments: {
    label: 'Environments',
    field: GLOBAL_ENUM_FIELD.environment,
    objectType: GLOBAL_ENUM_GROUP,
    icon: Globe2,
  },
  Scopes: {
    label: 'Scopes',
    field: GLOBAL_ENUM_FIELD.scope,
    objectType: GLOBAL_ENUM_GROUP,
    icon: Focus,
  },
  'File Categories': {
    label: 'File Categories',
    field: FILE_CATEGORY_ENUM.field,
    objectType: GLOBAL_ENUM_GROUP,
    icon: Files,
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
    objectType: GLOBAL_ENUM_GROUP,
    field: GLOBAL_ENUM_FIELD.accessModel,
    icon: ScanEye,
  },
  'Encryption Statuses': {
    label: 'Encryption Statuses',
    objectType: GLOBAL_ENUM_GROUP,
    field: GLOBAL_ENUM_FIELD.encryptionStatus,
    icon: EarthLock,
  },
  'Security Tiers': {
    label: 'Security Tiers',
    objectType: GLOBAL_ENUM_GROUP,
    field: GLOBAL_ENUM_FIELD.securityTier,
    icon: Layers,
  },
  'Criticality Levels': {
    label: 'Criticality Levels',
    objectType: GLOBAL_ENUM_GROUP,
    field: GLOBAL_ENUM_FIELD.criticality,
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
  'Vulnerability Statuses': {
    label: 'Vulnerability Statuses',
    objectType: 'vulnerability',
    field: 'status',
    icon: ShieldAlert,
  },
  'Finding Statuses': {
    label: 'Finding Statuses',
    objectType: 'finding',
    field: 'status',
    icon: SearchCheck,
  },
}

export const ENUM_GROUPS = Object.keys(ENUM_GROUP_MAP)

export const getEnumFilter = (view: string, search: string): CustomTypeEnumWhereInput => {
  const filter: CustomTypeEnumWhereInput = { nameContainsFold: search }
  const config = ENUM_GROUP_MAP[view]

  if (!config || view === 'All Enums') return filter

  if (config.objectType) filter.objectType = toApiObjectType(config.objectType)
  if (config.field) filter.field = config.field

  return filter
}
