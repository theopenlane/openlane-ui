'use client'

import React, { useCallback } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import {
  type RemediationsNodeNonNull,
  useRemediation,
  useCreateRemediation,
  useUpdateRemediation,
  useCreateBulkCSVRemediation,
  useBulkEditRemediation,
  useBulkDeleteRemediation,
  useGetRemediationAssociations,
} from '@/lib/graphql-hooks/remediation'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type RemediationSheetConfig, type RemediationTablePageConfig, type RemediationFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type CreateRemediationInput, type UpdateRemediationInput, type GetRemediationAssociationsQuery } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { REMEDIATION_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const RemediationPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useRemediation(id || undefined)
  const { data: associationsData } = useGetRemediationAssociations(id || undefined)

  const extractAssociations = useCallback((assocData: GetRemediationAssociationsQuery) => {
    const remediation = assocData.remediation
    return {
      controlIDs: (remediation.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (remediation.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      findingIDs: (remediation.findings?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      vulnerabilityIDs: (remediation.vulnerabilities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  function getName(remediation: RemediationsNodeNonNull) {
    return remediation?.title || remediation?.displayID || remediation?.externalID
  }

  const baseUpdateMutation = useUpdateRemediation()
  const baseCreateMutation = useCreateRemediation()
  const baseBulkCreateMutation = useCreateBulkCSVRemediation()
  const baseBulkDeleteMutation = useBulkDeleteRemediation()
  const baseBulkEditMutation = useBulkEditRemediation()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateRemediationInput }) => baseUpdateMutation.mutateAsync({ updateRemediationId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateRemediationInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkRemediation
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

  const sheetConfig: RemediationSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.remediation : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, findingIDs, vulnerabilityIDs, ...rest } = data
      const associationPayload = buildAssociationPayload(
        REMEDIATION_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, findingIDs, vulnerabilityIDs },
        isCreate,
        initialAssociationsRef.current,
      )
      return {
        ...rest,
        ...associationPayload,
      }
    },
    getName,
    renderFields: (props: RemediationFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  const tableConfig: RemediationTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['titleContainsFold', 'summaryContainsFold', 'externalIDContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkRemediation
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateRemediationInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default RemediationPage
