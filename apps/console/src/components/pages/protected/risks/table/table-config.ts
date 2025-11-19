import { FilterIcons } from '@/components/shared/enum-mapper/risk-enum'
import { FilterField } from '@/types'
import { OrderDirection, RiskOrderField, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'

const enumToOptions = (e: Record<string, string>) =>
  Object.values(e).map((value) => ({
    label: value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }))

export const getRisksFilterFields = (programOptions: { value: string; label: string }[]): FilterField[] => [
  { key: 'categoryContainsFold', label: 'Category', type: 'text', icon: FilterIcons.Category },
  {
    key: 'impactIn',
    label: 'Impact',
    type: 'multiselect',
    options: enumToOptions(RiskRiskImpact),
    icon: FilterIcons.Impact,
  },
  {
    key: 'likelihoodIn',
    label: 'Likelihood',
    type: 'multiselect',
    options: enumToOptions(RiskRiskLikelihood),
    icon: FilterIcons.Likelihood,
  },
  {
    key: 'riskTypeContainsFold',
    label: 'Risk Type',
    type: 'text',
    icon: FilterIcons.RiskType,
  },
  { key: 'score', label: 'Score', type: 'sliderNumber', icon: FilterIcons.Score },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: enumToOptions(RiskRiskStatus),
    icon: FilterIcons.Status,
  },
  {
    key: 'hasProgramsWith',
    label: 'Program Name',
    type: 'multiselect',
    options: programOptions,
    icon: FilterIcons.ProgramName,
  },
]

export const RISKS_SORT_FIELDS = [
  {
    key: RiskOrderField.name,
    label: 'Name',
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
