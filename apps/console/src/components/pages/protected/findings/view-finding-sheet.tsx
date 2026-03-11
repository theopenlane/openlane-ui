'use client'

import React, { useCallback } from 'react'
import useFormSchema from './hooks/use-form-schema'
import { type FindingsNodeNonNull, useFinding, useUpdateFinding, useCreateFinding, useGetFindingAssociations } from '@/lib/graphql-hooks/finding'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from './table/table-config'
import { type FindingSheetConfig, type FindingFieldProps, objectType } from './table/types'
import { type CreateFindingInput, type UpdateFindingInput, type GetFindingAssociationsQuery } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewFindingSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useFinding(entityId || undefined)
  const { data: associationsData } = useGetFindingAssociations(entityId || undefined)

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
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, entityId)

  const baseUpdateMutation = useUpdateFinding()
  const baseCreateMutation = useCreateFinding()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateFindingInput }) => baseUpdateMutation.mutateAsync({ updateFindingId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateFindingInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const enumOpts = { environmentOptions, scopeOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope }

  function getName(d: FindingsNodeNonNull) {
    return d?.displayName || d?.displayID || d?.externalID
  }

  const sheetConfig: FindingSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.finding : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    onClose,
    buildPayload: async (formData) => {
      const { controlIDs, subcontrolIDs, riskIDs, programIDs, taskIDs, assetIDs, scanIDs, remediationIDs, reviewIDs, ...rest } = formData
      const associationPayload = buildAssociationPayload(
        FINDING_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, riskIDs, programIDs, taskIDs, assetIDs, scanIDs, remediationIDs, reviewIDs },
        false,
        initialAssociationsRef.current,
      )
      return { ...rest, ...associationPayload }
    },
    getName,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewFindingSheet
