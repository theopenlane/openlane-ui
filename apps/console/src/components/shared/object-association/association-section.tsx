'use client'

import React, { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { Section, TBaseAssociatedNode } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

export type AssociationNode = {
  id?: string
  name?: string | null
  displayName?: string | null
  displayID?: string
  fullName?: string
  target?: string
  title?: string
  refCode?: string
  description?: string | null
  summary?: string | null
  details?: string | null
  referenceFramework?: string | null
  __typename?: string
}

export type AssociationConnection = {
  edges?: Array<{ node?: AssociationNode | null } | null> | null
  totalCount?: number
}

export type AssociationsRoot = Record<string, AssociationConnection | undefined>

export type AssociationsData = Record<string, AssociationsRoot | undefined>

type SectionMapping = {
  key: string
  nameExtractor: (node: AssociationNode) => string
  displayIdExtractor: (node: AssociationNode) => string
  extraFields?: (node: AssociationNode) => Partial<TBaseAssociatedNode>
}

export type AssociationSectionConfig = {
  entityType: keyof typeof ASSOCIATION_REMOVAL_CONFIG
  dataRootField: string
  queryKeyPrefix: string
  allowedObjectTypes: ObjectTypeObjects[]
  sectionMappings: SectionMapping[]
  initialDataKeys: Record<string, string>
}

type AssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
  config: AssociationSectionConfig
  associationsData: AssociationsData | undefined
  onUpdateEntity: (input: Record<string, unknown>) => Promise<void>
  SetAssociationDialog: React.ComponentType<{ entityId: string }>
}

export const AssociationSection = ({ data, isEditing, isCreate, isEditAllowed, config, associationsData, onUpdateEntity, SetAssociationDialog }: AssociationSectionProps) => {
  const entityId = data?.id
  const form = useFormContext()
  const queryClient = useQueryClient()

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData) return {}
    const root = associationsData[config.dataRootField]
    if (!root) return {}

    const result: TObjectAssociationMap = {}
    for (const [inputName, edgesField] of Object.entries(config.initialDataKeys)) {
      const connection = root[edgesField]
      result[inputName] = (connection?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? []
    }
    return result
  }, [associationsData, config.dataRootField, config.initialDataKeys])

  useEffect(() => {
    if (isEditing || isCreate) return
    if (Object.keys(initialData).length > 0) {
      Object.entries(initialData).forEach(([key, ids]) => {
        form.setValue(key, ids, { shouldDirty: false })
      })
    }
  }, [initialData, form, isEditing, isCreate])

  const sections: Section = useMemo(() => {
    if (!associationsData) return {}
    const root = associationsData[config.dataRootField]
    if (!root) return {}

    const result: Section = {}
    for (const mapping of config.sectionMappings) {
      const connection = root[mapping.key]
      if (connection?.edges?.length) {
        result[mapping.key] = {
          edges: connection.edges.map((e) => ({
            node: e?.node
              ? {
                  id: e.node.id ?? '',
                  name: mapping.nameExtractor(e.node),
                  displayID: mapping.displayIdExtractor(e.node),
                  ...mapping.extraFields?.(e.node),
                }
              : null,
          })),
          totalCount: connection.totalCount,
        }
      } else {
        result[mapping.key] = undefined
      }
    }
    return result
  }, [associationsData, config.dataRootField, config.sectionMappings])

  const removalConfig = ASSOCIATION_REMOVAL_CONFIG[config.entityType]

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: entityId ?? '',
    handleUpdateField: onUpdateEntity,
    queryClient,
    cacheTargets: [{ queryKey: [config.queryKeyPrefix, entityId, 'associations'], dataRootField: config.dataRootField }],
    invalidateQueryKeys: [[config.queryKeyPrefix]],
    sectionKeyToRemoveField: removalConfig.sectionKeyToRemoveField as Record<string, string>,
    sectionKeyToDataField: removalConfig.sectionKeyToDataField as Record<string, string>,
    sectionKeyToInvalidateQueryKey: removalConfig.sectionKeyToInvalidateQueryKey as Partial<Record<string, readonly unknown[]>>,
  })

  if (isEditing || isCreate) {
    return (
      <Panel className="mt-5">
        <PanelHeader heading="Associate Related Objects" noBorder />
        <ObjectAssociation
          initialData={initialData}
          onIdChange={(updatedMap) => {
            Object.entries(updatedMap).forEach(([key, ids]) => {
              form.setValue(key, ids, { shouldDirty: true })
            })
          }}
          allowedObjectTypes={config.allowedObjectTypes}
        />
      </Panel>
    )
  }

  const hasSections = Object.values(sections).some((s) => s?.edges?.length)

  if (!hasSections && !isEditAllowed) return null

  return (
    <Panel className="mt-5">
      <div className="flex items-center justify-between">
        <PanelHeader heading="Associated Objects" noBorder />
        {isEditAllowed && entityId && <SetAssociationDialog entityId={entityId} />}
      </div>
      {hasSections && <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={isEditAllowed} onRemove={handleRemoveAssociation} />}
    </Panel>
  )
}
