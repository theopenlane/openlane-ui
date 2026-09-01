import { type ControlWhereInput, type EvidenceEvidenceStatus, type ReviewReviewStatus } from '@repo/codegen/src/schema'
import { FileCheck2 } from 'lucide-react'
import { defineFilterFields } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ReviewStatusOptions } from '@/components/shared/enum-mapper/review-enum'
import { EvidenceStatusFilterOptions } from '@/components/shared/enum-mapper/evidence-enum'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { buildCustomStandardFilterWhere, CUSTOM_STANDARD_FILTER_OPTION, CUSTOM_STANDARD_FILTER_VALUE, isCustomStandardFilter } from '@/components/shared/table-filter/custom-standard-filter'

type TOption = { value: string; label: string }

export const AUDITOR_CONTROL_EXPORT_FIELDS = ['refCode', 'title', 'description', 'category', 'subcategory', 'status', 'referenceFramework', 'controlOwner.name', 'internalPolicies.name']

export const AUDITOR_DASHBOARD_DEFAULT_FILTER_VALUES: TFilterState = { standardIDIn: [CUSTOM_STANDARD_FILTER_VALUE] }

export const AUDITOR_DASHBOARD_REMAPPED_FILTER_KEYS = ['reviewStatusIn', 'evidenceStatusIn'] as const

export const getAuditorDashboardFilterFields = (frameworkOptions: TOption[], ownerOptions: TOption[]) =>
  defineFilterFields<ControlWhereInput, (typeof AUDITOR_DASHBOARD_REMAPPED_FILTER_KEYS)[number]>()([
    {
      key: 'standardIDIn',
      label: 'Framework',
      type: 'multiselect',
      options: [...frameworkOptions, CUSTOM_STANDARD_FILTER_OPTION],
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
  ])

export const getAuditorDashboardQuickFilters = (programId: string): TQuickFilter[] => [
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

export const createAuditorControlsFilterMapper =
  (programId: string) =>
  (key: string, value: unknown): ControlWhereInput => {
    if (isCustomStandardFilter(key, value)) {
      return buildCustomStandardFilterWhere(value)
    }

    if (key === 'reviewStatusIn') {
      return { hasReviewsWith: [{ statusIn: value as ReviewReviewStatus[], hasProgramsWith: [{ id: programId }] }] }
    }

    if (key === 'evidenceStatusIn') {
      return { hasEvidenceWith: [{ statusIn: value as EvidenceEvidenceStatus[], hasProgramsWith: [{ id: programId }] }] }
    }

    return { [key]: value }
  }
