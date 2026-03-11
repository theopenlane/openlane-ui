'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useFormSchema from '@/components/pages/protected/scans/hooks/use-form-schema'
import { type ScansNodeNonNull, useScan, useUpdateScan, useCreateScan } from '@/lib/graphql-hooks/scan'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/scans/table/table-config'
import { type ScanSheetConfig, type ScanFieldProps, objectType } from '@/components/pages/protected/scans/table/types'
import { ScanScanStatus, ScanScanType, type ScanQuery, type CreateScanInput, type UpdateScanInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type ScanDetailsSheetProps = {
  queryParamKey: string
}

const normalizeData = (data: ScanQuery['scan']) =>
  normalizeEntityData(data, {
    assignedTo: { user: data?.assignedToUser, group: data?.assignedToGroup, stringValue: data?.assignedTo },
    performedBy: { user: data?.performedByUser, group: data?.performedByGroup, stringValue: data?.performedBy },
    reviewedBy: { user: data?.reviewedByUser, group: data?.reviewedByGroup, stringValue: data?.reviewedBy },
  })

const ScanDetailsSheet: React.FC<ScanDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const { form } = useFormSchema()
  const { data, isLoading } = useScan(entityId || undefined)

  const baseUpdateMutation = useUpdateScan()
  const baseCreateMutation = useCreateScan()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateScanInput }) => baseUpdateMutation.mutateAsync({ updateScanId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateScanInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const statusOptions = Object.values(ScanScanStatus).map((value) => ({ value, label: getEnumLabel(value) }))
  const scanTypeOptions = Object.values(ScanScanType).map((value) => ({ value, label: getEnumLabel(value) }))

  const enumOpts = { environmentOptions, scopeOptions, statusOptions, scanTypeOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope }

  function getName(d: ScansNodeNonNull) {
    return d?.target
  }

  const handleClose = () => {
    form.reset()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const sheetConfig: ScanSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.scan : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (formData) => {
      const { assignedTo, performedBy, reviewedBy, ...rest } = formData
      return {
        ...rest,
        ...buildResponsibilityPayload('assignedTo', assignedTo, { mode: 'update' }),
        ...buildResponsibilityPayload('performedBy', performedBy, { mode: 'update' }),
        ...buildResponsibilityPayload('reviewedBy', reviewedBy, { mode: 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: ScanFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={handleClose} {...sheetConfig} />
}

export default ScanDetailsSheet
