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

export const RISKS_FILTER_FIELDS: FilterField[] = [
  { key: 'category', label: 'Category', type: 'text' },
  {
    key: 'impact',
    label: 'Impact',
    type: 'select',
    options: enumToOptions(RiskRiskImpact),
  },
  {
    key: 'likelihood',
    label: 'Likelihood',
    type: 'select',
    options: enumToOptions(RiskRiskLikelihood),
  },
  {
    key: 'riskType',
    label: 'Risk Type',
    type: 'text',
  },
  { key: 'score', label: 'Score', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: enumToOptions(RiskRiskStatus),
  },
]

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
