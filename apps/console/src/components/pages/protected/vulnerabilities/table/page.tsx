'use client'

import React, { useCallback, useState } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import {
  type VulnerabilitiesNodeNonNull,
  useVulnerability,
  useCreateVulnerability,
  useUpdateVulnerability,
  useCreateBulkCSVVulnerability,
  useBulkEditVulnerability,
  useBulkDeleteVulnerability,
  useGetVulnerabilityAssociations,
} from '@/lib/graphql-hooks/vulnerability'
import VulnerabilitySeverityChart from '@/components/shared/severity-chart/severity-chart'
import { useSearchParams, useRouter } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type VulnerabilitySheetConfig, type VulnerabilityTablePageConfig, type VulnerabilityFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type CreateVulnerabilityInput, type UpdateVulnerabilityInput, type GetVulnerabilityAssociationsQuery, VulnerabilitySecurityLevel } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { VULNERABILITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import TaskDetailsSheet from '../../tasks/create-task/sidebar/task-details-sheet'
import ViewVulnerabilitySheet from '../view-vulnerability-sheet'
import type { Value } from 'platejs'

const DEFAULT_FILTER_VALUES = { open: true }

const VulnerabilityPage: React.FC = () => {
  const { form } = useFormSchema()
  const [selectedSeverity, setSelectedSeverity] = useState<'critical' | 'high' | 'medium' | 'low' | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const { data, isLoading } = useVulnerability(id || undefined)
  const { data: associationsData } = useGetVulnerabilityAssociations(id || undefined)

  const plateEditorHelper = usePlateEditor()

  const extractAssociations = useCallback((assocData: GetVulnerabilityAssociationsQuery) => {
    const vulnerability = assocData.vulnerability
    return {
      controlIDs: (vulnerability.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (vulnerability.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      findingIDs: (vulnerability.findings?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      remediationIDs: (vulnerability.remediations?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      reviewIDs: (vulnerability.reviews?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      assetIDs: (vulnerability.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (vulnerability.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

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

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkVulnerability
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

  const { enumOptions: vulnerabilityStatusOptions, onCreateOption: createVulnStatus } = useCreatableEnumOptions({
    objectType: 'vulnerability',
    field: 'status',
  })

  const tagOptions = useGetTags()

  const enumOpts = {
    environmentOptions,
    scopeOptions,
    tagOptions: tagOptions.tagOptions,
    vulnerabilityStatusOptions,
  }

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
    vulnerabilityStatusName: createVulnStatus,
  }

  const handleCloseViewSheet = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  // sheetConfig handles CREATE mode only — view/edit is handled by ViewVulnerabilitySheet below
  const sheetConfig: VulnerabilitySheetConfig = {
    objectType: objectType,
    form,
    entityId: null,
    data: isCreate ? data?.vulnerability : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (data): Promise<CreateVulnerabilityInput | UpdateVulnerabilityInput> => {
      const { controlIDs, subcontrolIDs, findingIDs, remediationIDs, reviewIDs, assetIDs, taskIDs, ...rest } = data
      const associationPayload = buildAssociationPayload(
        VULNERABILITY_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, findingIDs, remediationIDs, reviewIDs, assetIDs, taskIDs },
        isCreate,
        initialAssociationsRef.current,
      )

      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const cleaned = Object.fromEntries(Object.entries({ ...rest, description }).filter(([, v]) => v !== '' && v !== undefined))
      return {
        ...cleaned,
        ...associationPayload,
      } as CreateVulnerabilityInput | UpdateVulnerabilityInput
    },
    getName,
    renderFields: (props: VulnerabilityFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  const severityWhereFilter = selectedSeverity
    ? { securityLevelIn: [VulnerabilitySecurityLevel[selectedSeverity.toUpperCase() as keyof typeof VulnerabilitySecurityLevel]], vulnerabilityStatusNameIn: ['Open', 'In Progress', 'Triaged'] }
    : undefined

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
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkVulnerability
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateVulnerabilityInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
    additionalWhereFilter: severityWhereFilter,
    defaultFilterValues: DEFAULT_FILTER_VALUES,
    beforeTable: (
      <>
        {/* TODO: Uncomment when integrations page is released
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 mb-4 text-sm text-muted-foreground">
          <span>Setup integrations to automatically import vulnerabilities into Openlane</span>
          <Button variant="outline" size="sm" asChild>
            <a href="/settings/integrations">Setup Integrations</a>
          </Button>
        </div> */}
        <VulnerabilitySeverityChart selectedSeverity={selectedSeverity} onSeveritySelect={setSelectedSeverity} />
      </>
    ),
  }

  return (
    <>
      <GenericTablePage {...tableConfig} />
      <ViewVulnerabilitySheet entityId={isCreate ? null : id} onClose={handleCloseViewSheet} />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default VulnerabilityPage
