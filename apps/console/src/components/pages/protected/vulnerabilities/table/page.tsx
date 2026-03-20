'use client'

import React, { useCallback, useState, useEffect } from 'react'
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
import { useSearchParams, useRouter } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { Button } from '@repo/ui/button'
import { ShieldCheck } from 'lucide-react'
import { TrackRemediationForm, TrackRemediationHeader } from '../../remediations/track-remediation-inline'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type VulnerabilitySheetConfig, type VulnerabilityTablePageConfig, type VulnerabilityFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type CreateVulnerabilityInput, type UpdateVulnerabilityInput, type GetVulnerabilityAssociationsQuery } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { VULNERABILITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import TaskDetailsSheet from '../../tasks/create-task/sidebar/task-details-sheet'
import type { Value } from 'platejs'

const VulnerabilityPage: React.FC = () => {
  const [isTrackingRemediation, setIsTrackingRemediation] = useState(false)
  const [isRemediationPending, setIsRemediationPending] = useState(false)
  const [trackingDefaultTitle, setTrackingDefaultTitle] = useState<string | undefined>(undefined)

  const { form } = useFormSchema()

  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const trackRemediation = searchParams.get('trackRemediation') === 'true'

  useEffect(() => {
    if (trackRemediation && id) {
      setIsTrackingRemediation(true)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('trackRemediation')
      router.replace(`${window.location.pathname}?${newParams.toString()}`)
    } else if (!id) {
      setIsTrackingRemediation(false)
      setTrackingDefaultTitle(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, trackRemediation])

  const { data, isLoading } = useVulnerability(id || undefined)
  const { data: associationsData } = useGetVulnerabilityAssociations(id || undefined)

  useEffect(() => {
    if (isTrackingRemediation && data?.vulnerability) {
      const name = data.vulnerability.displayName || data.vulnerability.displayID || data.vulnerability.externalID || ''
      setTrackingDefaultTitle(`${name} Remediation`.trim() || undefined)
    }
  }, [isTrackingRemediation, data?.vulnerability])

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

  const tagOptions = useGetTags()

  const enumOpts = {
    environmentOptions,
    scopeOptions,
    tagOptions: tagOptions.tagOptions,
  }

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const handleCloseAfterCreate = () => {
    setIsTrackingRemediation(false)
    setTrackingDefaultTitle(undefined)
    form.reset()
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    newSearchParams.delete('create')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const sheetConfig: VulnerabilitySheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.vulnerability : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
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
      }
    },
    deleteMutation: {
      isPending: baseBulkDeleteMutation.isPending,
      mutateAsync: async ({ ids }) => {
        await baseBulkDeleteMutation.mutateAsync({ ids })
        return ids
      },
    },
    getName,
    renderFields: (props: VulnerabilityFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
    extraHeaderActions:
      id && !isTrackingRemediation ? (
        <Button icon={<ShieldCheck size={16} />} iconPosition="left" variant="primary" onClick={() => setIsTrackingRemediation(true)}>
          Track Remediation
        </Button>
      ) : undefined,
    overrideContent:
      isTrackingRemediation && id ? (
        <TrackRemediationForm entityId={id} entityType="vulnerability" onClose={handleCloseAfterCreate} onPendingChange={setIsRemediationPending} defaultTitle={trackingDefaultTitle} />
      ) : undefined,
    overrideHeader: isTrackingRemediation ? <TrackRemediationHeader onBack={() => setIsTrackingRemediation(false)} isPending={isRemediationPending} /> : undefined,
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

  return (
    <>
      <GenericTablePage {...tableConfig} />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default VulnerabilityPage
