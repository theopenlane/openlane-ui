'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import {
  VulnerabilitiesNodeNonNull,
  useVulnerability,
  useCreateVulnerability,
  useUpdateVulnerability,
  useCreateBulkCSVVulnerability,
  useBulkEditVulnerability,
  useBulkDeleteVulnerability,
} from '@/lib/graphql-hooks/vulnerability'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { VulnerabilitySheetConfig, VulnerabilityTablePageConfig, VulnerabilityFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '../create/utils'
import { CreateVulnerabilityInput, UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const VulnerabilityPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useVulnerability(id || undefined)

  const plateEditorHelper = usePlateEditor()

  function getName(data: VulnerabilitiesNodeNonNull) {
    return data?.displayName || data?.displayID || data?.externalID
  }

  const baseUpdateMutation = useUpdateVulnerability()
  const baseCreateMutation = useCreateVulnerability()
  const baseBulkCreateMutation = useCreateBulkCSVVulnerability()
  const baseBulkDeleteMutation = useBulkDeleteVulnerability()
  const baseBulkEditMutation = useBulkEditVulnerability()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateVulnerabilityInput }) => baseUpdateMutation.mutateAsync({ updateVulnerabilityId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateVulnerabilityInput) => {
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

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const tagOptions = useGetTags()

  const enumOpts = {
    environmentOptions,
    scopeOptions,
    tagOptions: tagOptions.tagOptions,
  }

  const sheetConfig: VulnerabilitySheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.vulnerability : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: (data) => buildPayload(data, plateEditorHelper),
    getName,
    renderFields: (props: VulnerabilityFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: VulnerabilityTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold', 'cveIDContainsFold', 'externalIDContainsFold'],
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
    onBulkEdit: async (ids: string[], input: UpdateVulnerabilityInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default VulnerabilityPage
