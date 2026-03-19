'use client'

import React from 'react'
import useFormSchema from './hooks/use-form-schema'
import { type RemediationsNodeNonNull, useRemediation, useCreateRemediation, useUpdateRemediation } from '@/lib/graphql-hooks/remediation'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from './table/table-config'
import { type RemediationSheetConfig, type RemediationFieldProps, objectType } from './table/types'
import { type CreateRemediationInput, type UpdateRemediationInput } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewRemediationSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useRemediation(entityId || undefined)

  const baseUpdateMutation = useUpdateRemediation()
  const baseCreateMutation = useCreateRemediation()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateRemediationInput }) => baseUpdateMutation.mutateAsync({ updateRemediationId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateRemediationInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const enumOpts = { environmentOptions, scopeOptions }
  const enumCreateHandlers = { environmentName: createEnvironment, scopeName: createScope }

  const getName = (d: RemediationsNodeNonNull) => {
    return d?.title || d?.displayID || d?.externalID
  }

  const sheetConfig: RemediationSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.remediation : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    onClose,
    basePath: '/exposure/remediations',
    buildPayload: async (formData) => {
      const { controlIDs: _controlIDs, subcontrolIDs: _subcontrolIDs, findingIDs: _findingIDs, vulnerabilityIDs: _vulnerabilityIDs, ...rest } = formData
      return { ...rest }
    },
    getName,
    renderFields: (props: RemediationFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewRemediationSheet
