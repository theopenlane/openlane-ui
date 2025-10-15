import { FilterIcons } from '@/components/shared/enum-mapper/risk-enum'
import { FilterField } from '@/types'
import { OrderDirection, RiskOrderField, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'
import { Proportions } from 'lucide-react'

const enumToOptions = (e: Record<string, string>) =>
  Object.values(e).map((value) => ({
    label: value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }))

export const getRisksFilterFields = (programOptions: { value: string; label: string }[]): FilterField[] => [
  { key: 'category', label: 'Category', type: 'text', icon: FilterIcons.Category },
  {
    key: 'impact',
    label: 'Impact',
    type: 'select',
    options: enumToOptions(RiskRiskImpact),
    icon: FilterIcons.Impact,
  },
  {
    key: 'likelihood',
    label: 'Likelihood',
    type: 'select',
    options: enumToOptions(RiskRiskLikelihood),
    icon: FilterIcons.Likelihood,
  },
  {
    key: 'riskType',
    label: 'Risk Type',
    type: 'text',
    icon: FilterIcons.RiskType,
  },
  { key: 'score', label: 'Score', type: 'text', icon: Proportions },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: enumToOptions(RiskRiskStatus),
    icon: FilterIcons.Status,
  },
  {
    key: 'hasProgramsWith',
    label: 'Program Name',
    type: 'select',
    forceKeyOperator: true,
    childrenObjectKey: 'id',
    options: programOptions,
    icon: FilterIcons.ProgramName,
  },
]

// export const RISKS_FILTER_FIELDS: FilterField[] = [
//   { key: 'category', label: 'Category', type: 'text', icon: FileQuestion },
//   {
//     key: 'impact',
//     label: 'Impact',
//     type: 'select',
//     options: enumToOptions(RiskRiskImpact),
//     icon: Briefcase,
//   },
//   {
//     key: 'likelihood',
//     label: 'Likelihood',
//     type: 'select',
//     options: enumToOptions(RiskRiskLikelihood),
//     icon: Briefcase,
//   },
//   {
//     key: 'riskType',
//     label: 'Risk Type',
//     type: 'text',
//     icon: SquareAsterisk,
//   },
//   { key: 'score', label: 'Score', type: 'text', icon: Proportions },
//   {
//     key: 'status',
//     label: 'Status',
//     type: 'select',
//     options: enumToOptions(RiskRiskStatus),
//     icon: Tags,
//   },
// ]

export const RISKS_SORT_FIELDS = [
  {
    key: RiskOrderField.name,
    label: 'Name',
    default: {
      key: RiskOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  {
    key: RiskOrderField.score,
    label: 'Score',
  },
  {
    key: RiskOrderField.risk_type,
    label: 'Risk Type',
  },
  {
    key: RiskOrderField.STATUS,
    label: 'Status',
  },
  {
    key: RiskOrderField.category,
    label: 'Category',
  },
]
