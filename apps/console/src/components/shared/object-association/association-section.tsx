'use client'

import { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { Section, TBaseAssociatedNode } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { TAssociationUpdateInput, TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { SetAssociationDialog, type SetAssociationDialogConfig } from '@/components/shared/object-association/set-association-dialog'

export type BaseAssociationSectionProps = {
  data?: { id: string }
  isEditing: boolean
  isCreate: boolean
  isEditAllowed: boolean
}

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

export type AssociationsRoot<TSectionKey extends string = string> = Partial<Record<TSectionKey, AssociationConnection | undefined>> & {
  id?: string
}

export type AssociationsData<TRootField extends string = string, TSectionKey extends string = string> = Partial<Record<TRootField, AssociationsRoot<TSectionKey> | undefined>>

type SectionMapping<TSectionKey extends string = string> = {
  key: TSectionKey
  nameExtractor: (node: AssociationNode) => string
  displayIdExtractor: (node: AssociationNode) => string
  extraFields?: (node: AssociationNode) => Partial<TBaseAssociatedNode>
}

export type AssociationSectionConfig<
  TEntityType extends keyof typeof ASSOCIATION_REMOVAL_CONFIG = keyof typeof ASSOCIATION_REMOVAL_CONFIG,
  TRootField extends string = string,
  TSectionKey extends string = string,
  TFieldKey extends string = string,
> = {
  entityType: TEntityType
  dataRootField: TRootField
  queryKeyPrefix: string
  allowedObjectTypes: readonly ObjectTypeObjects[]
  sectionMappings: readonly SectionMapping<TSectionKey>[]
  initialDataKeys: Record<TFieldKey, TSectionKey>
}

export type AssociationEntityConfig<
  TEntityType extends keyof typeof ASSOCIATION_REMOVAL_CONFIG = keyof typeof ASSOCIATION_REMOVAL_CONFIG,
  TRootField extends string = string,
  TSectionKey extends string = string,
  TFieldKey extends string = string,
> = AssociationSectionConfig<TEntityType, TRootField, TSectionKey, TFieldKey> & {
  dialogConfig: SetAssociationDialogConfig<TRootField, TSectionKey, TFieldKey>
  associationKeys: readonly TFieldKey[]
}

type AssociationFieldKey<TConfig extends AssociationEntityConfig> = Extract<keyof TConfig['initialDataKeys'], string>
type AssociationSectionKey<TConfig extends AssociationEntityConfig> = TConfig['sectionMappings'][number]['key']

type AssociationSectionProps<
  TConfig extends AssociationEntityConfig,
> = BaseAssociationSectionProps & {
  config: TConfig
  associationsData: AssociationsData<TConfig['dataRootField'], AssociationSectionKey<TConfig>> | undefined
  onUpdateEntity: (input: TAssociationUpdateInput<AssociationFieldKey<TConfig>>) => Promise<void>
}

export function AssociationSection<
  TConfig extends AssociationEntityConfig,
>({ data, isEditing, isCreate, isEditAllowed, config, associationsData, onUpdateEntity }: AssociationSectionProps<TConfig>) {
  type TFieldKey = AssociationFieldKey<TConfig>
  type TSectionKey = AssociationSectionKey<TConfig>
  type TRootField = TConfig['dataRootField']

  const entityId = data?.id
  const form = useFormContext<Record<string, string[]>>()
  const queryClient = useQueryClient()
  const setAssociationValue = form.setValue as (name: string, value: string[], options?: { shouldDirty?: boolean }) => void

  const initialData: TObjectAssociationMap<TFieldKey> = useMemo(() => {
    if (!associationsData) return {}
    const dataRootField = config.dataRootField as TRootField
    const root = associationsData[dataRootField] as AssociationsRoot<TSectionKey> | undefined
    if (!root) return {}

    const result: TObjectAssociationMap<TFieldKey> = {}
    for (const [inputName, edgesField] of Object.entries(config.initialDataKeys) as [TFieldKey, TSectionKey][]) {
      const connection = root[edgesField]
      result[inputName] = connection?.edges?.flatMap((edge) => {
        const id = edge?.node?.id
        return id ? [id] : []
      }) ?? []
    }
    return result
  }, [associationsData, config.dataRootField, config.initialDataKeys])

  useEffect(() => {
    if (isEditing || isCreate) return
    if (Object.keys(initialData).length > 0) {
      const initialEntries = Object.entries(initialData) as [TFieldKey, string[]][]
      initialEntries.forEach(([key, ids]) => {
        setAssociationValue(key, ids, { shouldDirty: false })
      })
    }
  }, [initialData, isEditing, isCreate, setAssociationValue])

  const sections: Section = useMemo(() => {
    if (!associationsData) return {}
    const dataRootField = config.dataRootField as TRootField
    const root = associationsData[dataRootField] as AssociationsRoot<TSectionKey> | undefined
    if (!root) return {}

    const result: Section = {}
    for (const mapping of config.sectionMappings) {
      const connection = root[mapping.key as TSectionKey]
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

  const handleRemoveAssociation = useAssociationRemoval<TAssociationUpdateInput<TFieldKey>, TSectionKey, string>({
    entityId,
    handleUpdateField: onUpdateEntity,
    queryClient,
    cacheTargets: [{ queryKey: [config.queryKeyPrefix, entityId, 'associations'], dataRootField: config.dataRootField }],
    invalidateQueryKeys: [[config.queryKeyPrefix]],
    sectionKeyToRemoveField: removalConfig.sectionKeyToRemoveField as Record<TSectionKey, Extract<keyof TAssociationUpdateInput<TFieldKey>, string>>,
    sectionKeyToDataField: removalConfig.sectionKeyToDataField as Record<TSectionKey, string>,
    sectionKeyToInvalidateQueryKey: removalConfig.sectionKeyToInvalidateQueryKey as Partial<Record<TSectionKey, readonly unknown[]>>,
  })

  if (isEditing || isCreate) {
    return (
      <Panel className="mt-5">
        <PanelHeader heading="Associate Related Objects" noBorder />
        <ObjectAssociation
          initialData={initialData}
          onIdChange={(updatedMap) => {
            const updatedEntries = Object.entries(updatedMap) as [TFieldKey, string[]][]
            updatedEntries.forEach(([key, ids]) => {
              setAssociationValue(key, ids, { shouldDirty: true })
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
        {isEditAllowed && entityId && <SetAssociationDialog config={config.dialogConfig} associationsData={associationsData} onUpdate={onUpdateEntity} />}
      </div>
      {hasSections && <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={isEditAllowed} onRemove={handleRemoveAssociation} />}
    </Panel>
  )
}
