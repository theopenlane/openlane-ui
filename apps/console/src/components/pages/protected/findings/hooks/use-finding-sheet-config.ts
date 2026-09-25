'use client'

import { buildResponsibilityPayload, normalizeEntityData, type ResponsibilitySelection, type ResponsibilityTarget } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useControlLinksForFinding } from '@/components/shared/object-association/finding-control-links'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type FindingDetailNode, useBulkDeleteFinding, useCreateFinding, useFinding, useGetFindingAssociations, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { type CreateFindingInput, type GetFindingAssociationsQuery, type UpdateFindingInput } from '@repo/codegen/src/schema'
import type { Value } from 'platejs'
import type React from 'react'
import { useCallback } from 'react'
import { FINDING_ASSIGNEE, FINDING_INTERNAL_OWNER, FINDING_REVIEWER } from '../finding-responsibility'
import { getFieldsToRender } from '../table/table-config'
import { type EnumOptions, type FindingFieldProps, type FindingSheetConfig, objectType } from '../table/types'
import { omitAssociationKeys, useFindingAssociationSplit } from './use-finding-association-split'
import useFormSchema from './use-form-schema'

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

  const extractAssociations = useCallback((assocData: GetFindingAssociationsQuery) => {
    const finding = assocData.finding
    return {
      controlIDs: (finding.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (finding.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      riskIDs: (finding.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      programIDs: (finding.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (finding.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      assetIDs: (finding.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (finding.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      remediationIDs: (finding.remediations?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      reviewIDs: (finding.reviews?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      vulnerabilityIDs: (finding.vulnerabilities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])

  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, entityId ?? null)

  const syncControlLinks = useControlLinksForFinding(associationsData?.finding?.controlMappings)
  const { splitAssociations, commitBaseline } = useFindingAssociationSplit({ isCreate, initialAssociationsRef })

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
    updateMutation,
    createMutation,
    deleteMutation,
    normalizeData,
    buildPayload: async (formData) => {
      const { internalOwner, assignedTo, reviewedBy, ...rest } = omitAssociationKeys(formData)
      const { entityInput: edgeAssociationPayload } = splitAssociations(formData)

      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const cleaned = Object.fromEntries(Object.entries({ ...rest, description }).filter(([, v]) => v !== '' && v !== undefined))
      const { dirtyFields } = form.formState
      const responsibilityPayload = (target: ResponsibilityTarget, selection: ResponsibilitySelection, isDirty: boolean) => {
        if (isCreate) return buildResponsibilityPayload(target.fieldBaseName, selection, { mode: 'create', stringFieldName: target.stringFieldName })
        return isDirty ? buildResponsibilityPayload(target.fieldBaseName, selection, { mode: 'update', stringFieldName: target.stringFieldName }) : {}
      }
      return {
        ...cleaned,
        ...edgeAssociationPayload,
        ...responsibilityPayload(FINDING_INTERNAL_OWNER, internalOwner, !!dirtyFields.internalOwner),
        ...responsibilityPayload(FINDING_ASSIGNEE, assignedTo, !!dirtyFields.assignedTo),
        ...responsibilityPayload(FINDING_REVIEWER, reviewedBy, !!dirtyFields.reviewedBy),
      }
    },
    onSaved: async ({ formData, created, entityId: savedId }) => {
      const findingID = savedId ?? created?.createFinding?.finding?.id
      if (!findingID) return
      await syncControlLinks(findingID, splitAssociations(formData).links)
      commitBaseline(formData)
    },
    getName,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers, riskScoresAction),
  }
}
