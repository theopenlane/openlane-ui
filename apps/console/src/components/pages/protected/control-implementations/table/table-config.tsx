import { z } from 'zod'
import { defineFilterFields } from '@/types'
import { ControlImplementationDocumentStatus, ControlImplementationOrderField, type ControlImplementationWhereInput } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { identityFilterKey } from '@/components/shared/table-filter/where-generator'
import { CONTROL_IMPLEMENTATIONS_HREF, getVerifiedLabel } from '@/utils/control-implementation'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Compliance', href: '/programs' },
  { label: 'Implementations', href: CONTROL_IMPLEMENTATIONS_HREF },
]

export const statusOptions = enumToOptions(ControlImplementationDocumentStatus)

export const filterFields = defineFilterFields<ControlImplementationWhereInput>()([
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: statusOptions,
    icon: FilterIcons.Status,
  },
  {
    key: 'verified',
    label: 'Verified',
    type: 'radio',
    icon: FilterIcons.SecurityFeatureEnforced,
    radioOptions: [
      { value: true, label: getVerifiedLabel(true) },
      { value: false, label: getVerifiedLabel(false) },
    ],
  },
])

export const bulkEditFieldSchema = z.object({
  status: z.enum(ControlImplementationDocumentStatus).optional(),
  verified: z.boolean().optional(),
  implementationDate: z.date().optional(),
})

export const CONTROL_IMPLEMENTATION_SORT_FIELDS = enumToSortFields(ControlImplementationOrderField)

export const visibilityFields = {
  implementationDate: false,
  verificationDate: false,
  tags: false,
  createdAt: false,
  createdBy: false,
  updatedBy: false,
}

export const mapFilterKey = (key: string, value: unknown): ControlImplementationWhereInput =>
  key === 'verified' && value === false ? { or: [{ verified: false }, { verifiedIsNil: true }] } : identityFilterKey<ControlImplementationWhereInput>(key, value)

export const buildSearchWhere = (term: string): ControlImplementationWhereInput[] => [{ hasControlsWith: [{ refCodeContainsFold: term }] }, { hasSubcontrolsWith: [{ refCodeContainsFold: term }] }]
