'use client'

import React, { useCallback } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { FindingsNodeNonNull, useFinding, useCreateFinding, useUpdateFinding, useCreateBulkCSVFinding, useBulkEditFinding, useBulkDeleteFinding, useGetFindingAssociations } from '@/lib/graphql-hooks/finding'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { FindingSheetConfig, FindingTablePageConfig, FindingFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { CreateFindingInput, UpdateFindingInput, GetFindingAssociationsQuery } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const FindingPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useFinding(id || undefined)
  const { data: associationsData } = useGetFindingAssociations(id || undefined)
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
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  function getName(finding: FindingsNodeNonNull) {
    return finding?.displayName || finding?.displayID || finding?.externalID
  }

  const baseUpdateMutation = useUpdateFinding()
  const baseCreateMutation = useCreateFinding()
  const baseBulkCreateMutation = useCreateBulkCSVFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()
  const baseBulkEditMutation = useBulkEditFinding()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateFindingInput }) => baseUpdateMutation.mutateAsync({ updateFindingId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateFindingInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
  })

  const enumOpts = {
    environmentOptions,
    scopeOptions,
  }

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const sheetConfig: FindingSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.finding : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, riskIDs, programIDs, taskIDs, assetIDs, scanIDs, remediationIDs, reviewIDs, ...rest } = data
      const associationPayload = buildAssociationPayload(FINDING_ASSOCIATION_CONFIG.associationKeys, { controlIDs, subcontrolIDs, riskIDs, programIDs, taskIDs, assetIDs, scanIDs, remediationIDs, reviewIDs }, isCreate, initialAssociationsRef.current)
      return {
        ...rest,
        ...associationPayload,
      }
    },
    getName,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  const tableConfig: FindingTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold', 'externalIDContainsFold', 'categoryContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await baseBulkDeleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateFindingInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default FindingPage
