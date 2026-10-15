'use client'

import { buildResponsibilityCreatePayload, normalizeEntityData, responsibilityInput } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useControlLinksForFinding } from '@/components/shared/object-association/finding-control-links'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { getEdgeNodes } from '@/components/shared/object-association/utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { associationsInput, omit, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type FindingDetailNode, useBulkDeleteFinding, useCreateFinding, useFinding, useGetFindingAssociations, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { type CreateFindingInput, type UpdateFindingInput } from '@repo/codegen/src/schema'
import type React from 'react'
import { FINDING_ASSIGNEE, FINDING_INTERNAL_OWNER, FINDING_REVIEWER } from '../finding-responsibility'
import { getFieldsToRender } from '../table/table-config'
import { type EnumOptions, type FindingFieldProps, type FindingSheetConfig, objectType } from '../table/types'
import { buildFindingCreateAssociations, getFindingControlLinks, omitAssociationKeys } from './use-finding-association-split'
import useFormSchema, { type FindingFormData } from './use-form-schema'

const FINDING_UPDATE_FIELDS = {
  description: richTextOrClear('clearDescription'),
  displayName: orClear('clearDisplayName'),
  category: orClear('clearCategory'),
  severity: orClear('clearSeverity'),
  findingStatusName: orClear('clearFindingStatusName'),
  priority: orClear('clearPriority'),
  score: orClear('clearScore'),
  numericSeverity: orClear('clearNumericSeverity'),
  exploitability: orClear('clearExploitability'),
  impact: orClear('clearImpact'),
  remediationSLA: orClear('clearRemediationSLA'),
  vector: orClear('clearVector'),
  open: orClear('clearOpen'),
  production: orClear('clearProduction'),
  public: orClear('clearPublic'),
  validated: orClear('clearValidated'),
  blocksProduction: orClear('clearBlocksProduction'),
  externalID: orClear('clearExternalID'),
  externalOwnerID: orClear('clearExternalOwnerID'),
  externalURI: orClear('clearExternalURI'),
  source: orClear('clearSource'),
  findingClass: orClear('clearFindingClass'),
  environmentName: orClear('clearEnvironmentName'),
  scopeName: orClear('clearScopeName'),
  stepsToReproduce: orClear('clearStepsToReproduce'),
  recommendedActions: orClear('clearRecommendedActions'),
  references: orClear('clearReferences'),
  internalOwner: responsibilityInput(FINDING_INTERNAL_OWNER),
  assignedTo: responsibilityInput(FINDING_ASSIGNEE),
  reviewedBy: responsibilityInput(FINDING_REVIEWER),
  controlIDs: omit,
  subcontrolIDs: associationsInput('subcontrolIDs'),
  riskIDs: associationsInput('riskIDs'),
  programIDs: associationsInput('programIDs'),
  taskIDs: associationsInput('taskIDs'),
  assetIDs: associationsInput('assetIDs'),
  scanIDs: associationsInput('scanIDs'),
  remediationIDs: associationsInput('remediationIDs'),
  reviewIDs: associationsInput('reviewIDs'),
  vulnerabilityIDs: associationsInput('vulnerabilityIDs'),
} satisfies TFieldMappers<FindingFormData, UpdateFindingInput>

const normalizeData = (data: FindingDetailNode) =>
  normalizeEntityData(data, {
    internalOwner: { personnel: data.internalOwnerIdentityHolder, user: data.internalOwnerUser, group: data.internalOwnerGroup, stringValue: data.internalOwner },
    assignedTo: { personnel: data.assignedToIdentityHolder, user: data.assignedToUser, group: data.assignedToGroup, stringValue: data.assignedTo },
    reviewedBy: { personnel: data.reviewedByIdentityHolder, user: data.reviewedByUser, group: data.reviewedByGroup, stringValue: data.reviewedBy },
  })

export const useFindingSheetConfig = (entityId: string | null | undefined, isCreate = false, riskScoresAction?: React.ReactNode): Omit<FindingSheetConfig, 'onClose'> & { enumOpts: EnumOptions } => {
  const { form } = useFormSchema()
  const { data, isLoading } = useFinding(entityId || undefined)
  const { data: associationsData } = useGetFindingAssociations(entityId || undefined)
  const plateEditorHelper = usePlateEditor()

  const syncControlLinks = useControlLinksForFinding(associationsData?.finding?.controlMappings)

  const baseUpdateMutation = useUpdateFinding()
  const baseCreateMutation = useCreateFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateFindingInput }) => baseUpdateMutation.mutateAsync({ updateFindingId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateFindingInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkFinding
    },
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: findingStatusOptions, onCreateOption: createFindingStatus } = useCreatableEnumOptions({ objectType: 'finding', field: 'status' })

  const enumOpts = { environmentOptions, scopeOptions, findingStatusOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope, findingStatusName: createFindingStatus }

  const getName = (d: FindingDetailNode) => d?.displayName || d?.displayID || d?.externalID

  return {
    enumOpts,
    objectType,
    form,
    entityId,
    isCreateMode: isCreate,
    data: entityId ? data?.finding : undefined,
    isFetching: isLoading,
    createMutation,
    deleteMutation,
    normalizeData,
    buildPayload: async (formData) => {
      const { internalOwner, assignedTo, reviewedBy, ...rest } = omitAssociationKeys(formData)
      const description = (await plateToHtmlOrNull(rest.description, plateEditorHelper)) ?? undefined
      const cleaned = Object.fromEntries(Object.entries({ ...rest, description }).filter(([, v]) => v !== '' && v !== undefined))
      return {
        ...cleaned,
        ...buildFindingCreateAssociations(formData),
        ...buildResponsibilityCreatePayload(FINDING_INTERNAL_OWNER, internalOwner),
        ...buildResponsibilityCreatePayload(FINDING_ASSIGNEE, assignedTo),
        ...buildResponsibilityCreatePayload(FINDING_REVIEWER, reviewedBy),
      }
    },
    update: { mutation: updateMutation, fields: FINDING_UPDATE_FIELDS },
    onSaved: async ({ formData, created, entityId: savedId }) => {
      const findingID = savedId ?? created?.createFinding?.finding?.id
      if (!findingID || !formData.controlIDs) return
      const linkedControlIDs = savedId ? getEdgeNodes(associationsData?.finding?.controls?.edges).map(({ id }) => id) : []
      await syncControlLinks(findingID, getFindingControlLinks(linkedControlIDs, formData.controlIDs))
    },
    getName,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers, riskScoresAction),
  }
}
