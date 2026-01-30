'use client'

import React, { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight } from 'lucide-react'
import { Control, ControlControlSource, Subcontrol, UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'

import { Group } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { usePathname } from 'next/navigation'
import { Property } from './fields/property'
import { EditableSelect } from './fields/editable-select'
import { LinkedProperty } from './fields/linked-property'
import { ReferenceProperty } from './fields/reference-property'
import { EditableSelectFromQuery } from './fields/editable-select-from-query'
import { AuthorityField } from './fields/authority-field'
import { MappedCategories } from './fields/mapped-categories'
import { Status } from './fields/status'
import { controlIconsMap } from '@/components/shared/enum-mapper/control-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

interface PropertiesCardProps {
  isEditing: boolean
  data?: Control | Subcontrol
  handleUpdate?: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  canEdit: boolean
}

const PropertiesCard: React.FC<PropertiesCardProps> = ({ data, isEditing, handleUpdate, canEdit }) => {
  const isSourceFramework = data?.source === ControlControlSource.FRAMEWORK
  const isEditAllowed = !isSourceFramework && canEdit
  const authorityEditAllowed = canEdit
  const path = usePathname()
  const isCreateSubcontrol = path.includes('/create-subcontrol')

  const [editingField, setEditingField] = useState<string | null>(null)
  const isGroupEditing = editingField === 'owner' || editingField === 'delegate'
  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: isEditing || isGroupEditing })
  const groups = groupsData?.groups?.edges?.map((edge) => edge?.node) || []

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'control',
      field: 'kind',
    },
  })

  const options: Option[] = groups.map((g) => ({
    label: g?.displayName || g?.name || '',
    value: g?.id || '',
  }))

  return (
    <Card className="p-4 bg-card rounded-xl shadow-xs">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        <AuthorityField
          label="Owner"
          fieldKey="controlOwnerID"
          icon={<CircleUser size={16} className="text-brand" />}
          value={data?.controlOwner as Group}
          editingKey="owner"
          isEditing={isEditing}
          isEditAllowed={authorityEditAllowed}
          editingField={editingField}
          setEditingField={setEditingField}
          options={options}
          handleUpdate={handleUpdate}
        />
        <AuthorityField
          label="Delegate"
          fieldKey="delegateID"
          icon={<CircleArrowRight size={16} className="text-brand" />}
          value={data?.delegate as Group}
          editingKey="delegate"
          isEditing={isEditing}
          isEditAllowed={authorityEditAllowed}
          editingField={editingField}
          setEditingField={setEditingField}
          options={options}
          handleUpdate={handleUpdate}
        />

        {data && <Property value={data.referenceFramework || 'CUSTOM'} label="Framework"></Property>}
        {data?.__typename === 'Subcontrol' && <LinkedProperty label="Control" href={`/controls/${data.control.id}/`} value={data.control.refCode} icon={controlIconsMap.Control} />}
        <EditableSelectFromQuery
          label="Category"
          name="category"
          isEditAllowed={isEditAllowed}
          isEditing={isEditing}
          icon={controlIconsMap.Category}
          handleUpdate={handleUpdate}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId="category"
        />
        <EditableSelectFromQuery
          label="Subcategory"
          name="subcategory"
          isEditAllowed={isEditAllowed}
          isEditing={isEditing}
          icon={controlIconsMap.Subcategory}
          handleUpdate={handleUpdate}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId="subcategory"
        />
        <Status data={data} isEditing={isEditing} handleUpdate={handleUpdate} activeField={editingField} setActiveField={setEditingField} fieldId="status" />
        <MappedCategories isEditing={isEditing} data={data} activeField={editingField} setActiveField={setEditingField} fieldId="mappedCategories" />
        <EditableSelect
          label="Source"
          name="source"
          isEditing={isEditing}
          options={enumToOptions(ControlControlSource)}
          handleUpdate={handleUpdate}
          isEditAllowed={isEditAllowed}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId="source"
        />
        <EditableSelect
          label="Type"
          name={data?.__typename === 'Subcontrol' || isCreateSubcontrol ? 'subcontrolKindName' : 'controlKindName'}
          isEditing={isEditing}
          isEditAllowed={isEditAllowed}
          options={enumOptions}
          handleUpdate={handleUpdate}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId={data?.__typename === 'Subcontrol' || isCreateSubcontrol ? 'subcontrolKindName' : 'controlKindName'}
        />
        {isEditing || data?.referenceID ? (
          <ReferenceProperty
            handleUpdate={handleUpdate}
            name="referenceID"
            label="Ref ID"
            tooltip="Internal reference id of the control, used to map across internal systems"
            value={data?.referenceID}
            isEditing={isEditing}
            activeField={editingField}
            setActiveField={setEditingField}
            fieldId="referenceID"
          />
        ) : null}
        {isEditing || data?.auditorReferenceID ? (
          <ReferenceProperty
            handleUpdate={handleUpdate}
            name="auditorReferenceID"
            label="Auditor ID"
            tooltip="Reference ID used by auditor, may vary from defined reference code from standard"
            value={data?.auditorReferenceID}
            isEditing={isEditing}
            activeField={editingField}
            setActiveField={setEditingField}
            fieldId="auditorReferenceID"
          />
        ) : null}
      </div>
    </Card>
  )
}

export default PropertiesCard
