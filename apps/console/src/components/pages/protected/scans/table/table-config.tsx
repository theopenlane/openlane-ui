import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import TargetField from '../create/form/fields/title-field'
import { type ScanQuery, ScanOrderField } from '@repo/codegen/src/schema'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type ScanFieldProps, type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const formId = 'edit' + ObjectNames.SCAN

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/scans' },
  { label: 'Scans', href: '/exposure/scans' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'targetContainsFold',
    label: 'Target',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumOptions.statusOptions,
  },
  {
    key: 'scanTypeIn',
    label: 'Scan Type',
    type: 'multiselect',
    icon: FilterIcons.Category,
    options: enumOptions.scanTypeOptions,
  },
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: enumOptions.environmentOptions,
  },
  {
    key: 'scopeNameIn',
    label: 'Scope',
    type: 'multiselect',
    icon: FilterIcons.Scope,
    options: enumOptions.scopeOptions,
  },
]

export const SCANS_SORT_FIELDS = enumToSortFields(ScanOrderField)

export const visibilityFields = {
  id: false,
  target: true,
  scanType: true,
  status: true,
  scanDate: true,
  scanSchedule: false,
  nextScanRunAt: true,
  environmentName: false,
  scopeName: false,
  assignedTo: false,
  performedBy: true,
  reviewedBy: false,
  createdAt: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
}

export const getFieldsToRender = (props: ScanFieldProps, enumOptions: EnumOptions) => {
  return (
    <div className="mr-6">
      <div className="mb-6">
        <TargetField
          isEditing={props.isEditing}
          isEditAllowed={props.isEditAllowed}
          initialValue={props.isCreate ? '' : ((props.data as ScanQuery['scan'])?.target ?? '')}
          internalEditing={props.internalEditing}
          setInternalEditing={props.setInternalEditing}
          handleUpdateField={props.handleUpdateField}
        />
      </div>
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
      />
    </div>
  )
}
