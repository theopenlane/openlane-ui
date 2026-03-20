'use client'

import React, { useState, useEffect } from 'react'
import { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useCreateBulkCSVFinding, useBulkEditFinding, useBulkDeleteFinding } from '@/lib/graphql-hooks/finding'
import { useSearchParams, useRouter } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type FindingTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { useFindingSheetConfig } from '../hooks/use-finding-sheet-config'
import { Button } from '@repo/ui/button'
import { ShieldCheck } from 'lucide-react'
import { TrackRemediationForm, TrackRemediationHeader } from '../../remediations/track-remediation-inline'
import TaskDetailsSheet from '../../tasks/create-task/sidebar/task-details-sheet'

const FindingPage: React.FC = () => {
  const [isTrackingRemediation, setIsTrackingRemediation] = useState(false)
  const [isRemediationPending, setIsRemediationPending] = useState(false)
  const [trackingDefaultTitle, setTrackingDefaultTitle] = useState<string | undefined>(undefined)

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

  const { enumOpts, form, ...sheetConfig } = useFindingSheetConfig(id, isCreate)

  useEffect(() => {
    if (isTrackingRemediation && sheetConfig.data) {
      const d = sheetConfig.data
      const name = d.displayName || d.displayID || d.externalID || ''
      setTrackingDefaultTitle(`${name} Remediation`.trim() || undefined)
    }
     
  }, [isTrackingRemediation, sheetConfig.data])

  const handleCloseAfterCreate = () => {
    setIsTrackingRemediation(false)
    setTrackingDefaultTitle(undefined)
    form.reset()
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    newSearchParams.delete('create')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const baseBulkCreateMutation = useCreateBulkCSVFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()
  const baseBulkEditMutation = useBulkEditFinding()

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => baseBulkCreateMutation.mutateAsync({ input: params.input }),
  }

  const trackingSheetConfig = {
    ...sheetConfig,
    extraHeaderActions:
      id && !isTrackingRemediation ? (
        <Button icon={<ShieldCheck size={16} />} iconPosition="left" variant="primary" onClick={() => setIsTrackingRemediation(true)}>
          Track Remediation
        </Button>
      ) : undefined,
    overrideContent:
      isTrackingRemediation && id ? (
        <TrackRemediationForm entityId={id} entityType="finding" onClose={handleCloseAfterCreate} onPendingChange={setIsRemediationPending} defaultTitle={trackingDefaultTitle} />
      ) : undefined,
    overrideHeader: isTrackingRemediation ? <TrackRemediationHeader onBack={() => setIsTrackingRemediation(false)} isPending={isRemediationPending} /> : undefined,
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
    sheetConfig: trackingSheetConfig,
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

  return (
    <>
      <GenericTablePage {...tableConfig} />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default FindingPage
