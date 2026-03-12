'use client'

import React, { useCallback } from 'react'
import useFormSchema from './hooks/use-form-schema'
import { type ScansNodeNonNull, useScan, useCreateScan, useUpdateScan } from '@/lib/graphql-hooks/scan'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from './table/table-config'
import { type ScanSheetConfig, type ScanFieldProps, objectType } from './table/types'
import { type CreateScanInput, type UpdateScanInput, ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewScanSheet: React.FC<Props> = ({ entityId, onClose }) => {
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

  const normalizeData = useCallback(
    (d: ScansNodeNonNull) =>
      normalizeEntityData(d, {
        assignedTo: { user: d?.assignedToUser, group: d?.assignedToGroup, stringValue: d?.assignedTo },
        performedBy: { user: d?.performedByUser, group: d?.performedByGroup, stringValue: d?.performedBy },
        reviewedBy: { user: d?.reviewedByUser, group: d?.reviewedByGroup, stringValue: d?.reviewedBy },
      }),
    [],
  )

  const sheetConfig: ScanSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.scan : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    onClose,
    normalizeData,
    basePath: '/exposure/scans',
    buildPayload: async (formData) => {
      const { assignedTo, performedBy, reviewedBy, ...rest } = formData
      return {
        ...rest,
        ...buildResponsibilityPayload('assignedTo', assignedTo, { mode: 'update' }),
        ...buildResponsibilityPayload('performedBy', performedBy, { mode: 'update' }),
        ...buildResponsibilityPayload('reviewedBy', reviewedBy, { mode: 'update' }),
      }
    },
    getName,
    renderFields: (props: ScanFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewScanSheet
