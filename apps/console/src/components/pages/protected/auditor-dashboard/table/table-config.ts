import { FileCheck2 } from 'lucide-react'
import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ReviewStatusOptions } from '@/components/shared/enum-mapper/review-enum'
import { EvidenceStatusFilterOptions } from '@/components/shared/enum-mapper/evidence-enum'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'

type TOption = { value: string; label: string }

export const getAuditorDashboardFilterFields = (frameworkOptions: TOption[], ownerOptions: TOption[]): FilterField[] => [
  {
    key: 'standardIDIn',
    label: 'Framework',
    type: 'multiselect',
    options: [...frameworkOptions, { value: 'CUSTOM', label: 'CUSTOM' }],
    icon: FilterIcons.Standard,
  },
  {
    key: 'reviewStatusIn',
    label: 'Review Status',
    type: 'multiselect',
    options: ReviewStatusOptions,
    icon: FilterIcons.Status,
  },
  {
    key: 'evidenceStatusIn',
    label: 'Evidence Status',
    type: 'multiselect',
    options: EvidenceStatusFilterOptions,
    icon: FileCheck2,
  },
  {
    key: 'controlOwnerIDIn',
    label: 'Owner',
    type: 'multiselect',
    options: ownerOptions,
    icon: FilterIcons.Owners,
  },
]

export const getAuditorDashboardQuickFilters = (programId: string): TQuickFilter[] => [
  {
    label: 'Organization Controls',
    key: 'organizationControls',
    type: 'custom',
    getCondition: () => ({ referenceFrameworkIsNil: true }) as TFilterState,
    isActive: false,
  },
  {
    label: 'Framework Controls',
    key: 'frameworkControls',
    type: 'custom',
    getCondition: () => ({ referenceFrameworkNotNil: true }) as TFilterState,
    isActive: false,
  },
  {
    label: 'Review Not Started',
    key: 'reviewNotStarted',
    type: 'custom',
    getCondition: () => ({ not: { hasReviewsWith: [{ hasProgramsWith: [{ id: programId }] }] } }) as TFilterState,
    isActive: false,
  },
  {
    label: 'Evidence Missing',
    key: 'evidenceMissing',
    type: 'custom',
    getCondition: () => ({ not: { hasEvidenceWith: [{ hasProgramsWith: [{ id: programId }] }] } }) as TFilterState,
    isActive: false,
  },
]
