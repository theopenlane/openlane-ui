'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight, Tag } from 'lucide-react'
import { ControlControlSource, type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'

import { type Group } from '@repo/codegen/src/schema'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
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
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit as canEditCheck } from '@/lib/authz/utils'
import useClickOutside from '@/hooks/useClickOutside'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import type { ControlByIdNode } from '@/lib/graphql-hooks/control'
import type { SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

type ControlPropertiesCardProps = {
  isEditing: boolean
  data?: ControlByIdNode
  handleUpdate?: (val: UpdateControlInput) => void
  canEdit: boolean
}

type SubcontrolPropertiesCardProps = {
  isEditing: boolean
  data?: SubcontrolByIdNode
  handleUpdate?: (val: UpdateSubcontrolInput) => void
  canEdit: boolean
}

type PropertiesCardProps = ControlPropertiesCardProps | SubcontrolPropertiesCardProps

const PropertiesCard: React.FC<PropertiesCardProps> = ({ data, isEditing, handleUpdate, canEdit }) => {
  const isSourceFramework = data?.source === ControlControlSource.FRAMEWORK
  const isEditAllowed = !isSourceFramework && canEdit
  const authorityEditAllowed = canEdit
  const path = usePathname()
  const isCreateSubcontrol = path.includes('/create-subcontrol')

  const handleUpdateAdapter = useCallback(
    (val: UpdateControlInput | UpdateSubcontrolInput) => {
      if (!handleUpdate) return
      if (data?.__typename === 'Subcontrol') {
        ;(handleUpdate as (input: UpdateSubcontrolInput) => void)(val as UpdateSubcontrolInput)
        return
      }
      ;(handleUpdate as (input: UpdateControlInput) => void)(val as UpdateControlInput)
    },
    [data?.__typename, handleUpdate],
  )

  const [editingField, setEditingField] = useState<string | null>(null)
  const isGroupEditing = editingField === 'owner' || editingField === 'delegate'
  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: isEditing || isGroupEditing })
  const groups = groupsData?.groups?.edges?.map((edge) => edge?.node) || []

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.CONTROL),
      field: 'kind',
    },
  })

  const { tagOptions } = useGetTags()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateTags = canEditCheck(orgPermission?.roles)

  const [selectedTags, setSelectedTags] = useState<Option[]>([])

  const dataTagsKey = (data?.tags ?? []).join(',')
  const [prevDataTagsKey, setPrevDataTagsKey] = useState(dataTagsKey)
  if (dataTagsKey !== prevDataTagsKey) {
    setPrevDataTagsKey(dataTagsKey)
    if (editingField !== 'tags') {
      const tags = dataTagsKey ? dataTagsKey.split(',') : []
      setSelectedTags(tags.map((t) => ({ value: t, label: t })))
    }
  }

  const tagsRef = useClickOutside(() => {
    if (editingField !== 'tags' || isEditing) return
    const current = data?.tags ?? []
    const next = selectedTags.map((t) => t.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed) {
      handleUpdateAdapter({ tags: next } as UpdateControlInput)
    }
    setEditingField(null)
  })

  useEscapeKey(
    () => {
      setEditingField(null)
      setSelectedTags((data?.tags ?? []).map((t) => ({ value: t, label: t })))
    },
    { enabled: editingField === 'tags' },
  )

  const prevIsEditingRef = React.useRef(isEditing)
  useEffect(() => {
    if (prevIsEditingRef.current && !isEditing) {
      const current = data?.tags ?? []
      const next = selectedTags.map((t) => t.value)
      const changed = current.length !== next.length || current.some((val) => !next.includes(val))
      if (changed) {
        handleUpdateAdapter({ tags: next } as UpdateControlInput)
      }
    }
    prevIsEditingRef.current = isEditing
  }, [isEditing, data?.tags, handleUpdateAdapter, selectedTags])

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
          handleUpdate={handleUpdateAdapter}
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
          handleUpdate={handleUpdateAdapter}
        />

        {data && <Property value={data.referenceFramework || 'CUSTOM'} label="Framework"></Property>}
        {data?.__typename === 'Subcontrol' && <LinkedProperty label="Control" href={`/controls/${data.control.id}/`} value={data.control.refCode} icon={controlIconsMap.Control} />}
        <EditableSelectFromQuery
          label="Category"
          name="category"
          isEditAllowed={isEditAllowed}
          isEditing={isEditing}
          icon={controlIconsMap.Category}
          handleUpdate={handleUpdateAdapter}
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
          handleUpdate={handleUpdateAdapter}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId="subcategory"
        />
        <Status data={data} isEditing={isEditing} handleUpdate={handleUpdateAdapter} activeField={editingField} setActiveField={setEditingField} fieldId="status" />
        <MappedCategories isEditing={isEditing} data={data} activeField={editingField} setActiveField={setEditingField} fieldId="mappedCategories" />
        <EditableSelect
          label="Source"
          name="source"
          isEditing={isEditing}
          options={enumToOptions(ControlControlSource)}
          handleUpdate={handleUpdateAdapter}
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
          handleUpdate={handleUpdateAdapter}
          activeField={editingField}
          setActiveField={setEditingField}
          fieldId={data?.__typename === 'Subcontrol' || isCreateSubcontrol ? 'subcontrolKindName' : 'controlKindName'}
        />
        {isEditing || data?.referenceID ? (
          <ReferenceProperty
            handleUpdate={handleUpdateAdapter}
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
            handleUpdate={handleUpdateAdapter}
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

        <div className={`flex justify-between items-start ${isEditing || editingField === 'tags' ? 'flex-col items-start' : ''}`}>
          <div className="min-w-40">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="flex gap-2 items-center">
                <Tag size={16} className="text-brand" />
                <span className="text-sm">Tags</span>
              </div>
            </div>
          </div>

          <div className="grid w-full items-center gap-2" ref={tagsRef}>
            <div className="flex gap-2 items-center flex-wrap">
              {isEditing || editingField === 'tags' ? (
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  className="w-full"
                  placeholder="Add tag..."
                  creatable={canCreateTags}
                  value={selectedTags}
                  onChange={(opts) => {
                    setSelectedTags(opts)
                  }}
                />
              ) : (
                <HoverPencilWrapper
                  showPencil={canEdit}
                  className={`w-full flex gap-2 flex-wrap ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onPencilClick={() => {
                    if (!isEditing && canEdit) {
                      setSelectedTags((data?.tags ?? []).map((t) => ({ value: t, label: t })))
                      setEditingField('tags')
                    }
                  }}
                >
                  <div
                    onDoubleClick={() => {
                      if (!isEditing && canEdit) {
                        setSelectedTags((data?.tags ?? []).map((t) => ({ value: t, label: t })))
                        setEditingField('tags')
                      }
                    }}
                  >
                    {data?.tags?.length ? (
                      <div className="flex gap-2 flex-wrap">
                        {data.tags.map((tag) => (
                          <TagChip key={tag} tag={tag} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">No tags</span>
                    )}
                  </div>
                </HoverPencilWrapper>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PropertiesCard
