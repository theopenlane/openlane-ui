import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/risk-enum'
import { FilterField } from '@/types'
import { RiskOrderField, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const getRisksFilterFields = (
  programOptions: { value: string; label: string }[],
  riskKindOptions: { value: string; label: string }[],
  riskCategoryOptions: { value: string; label: string }[],
  tagOptions: { value: string; label: string }[],
): FilterField[] => [
  {
    key: 'riskCategoryNameIn',
    label: 'Category',
    type: 'multiselect',
    icon: FilterIcons.Category,
    options: riskCategoryOptions,
  },

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
    key: 'riskKindNameIn',
    label: 'Risk Type',
    type: 'multiselect',
    icon: FilterIcons.RiskType,
    options: riskKindOptions,
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
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Status,
    options: tagOptions,
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
    key: RiskOrderField.STATUS,
    label: 'Status',
  },
]
