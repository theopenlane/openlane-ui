'use client'

import React, { useEffect } from 'react'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import useFormSchema from './hooks/use-form-schema'
import { useCreateRemediation, useUpdateRemediation } from '@/lib/graphql-hooks/remediation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getFieldsToRender } from './table/table-config'
import { type RemediationFieldProps, objectType } from './table/types'
import { type CreateRemediationInput, type UpdateRemediationInput } from '@repo/codegen/src/schema'

type Props = {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<CreateRemediationInput>
  defaultTitle?: string
  onSuccess?: () => void
}

const CreateRemediationSheet = ({ isOpen, onClose, initialData, defaultTitle, onSuccess }: Props) => {
  const { form } = useFormSchema()
  useEffect(() => {
    if (isOpen) {
      form.reset({ title: defaultTitle ?? '' })
    }
  }, [isOpen, defaultTitle, form])

  const baseCreateMutation = useCreateRemediation()
  const baseUpdateMutation = useUpdateRemediation()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateRemediationInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      onSuccess?.()
      return result
    },
  }

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateRemediationInput }) => baseUpdateMutation.mutateAsync({ updateRemediationId: params.id, input: params.input }),
  }

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const enumOpts = { environmentOptions, scopeOptions }
  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  return (
    <GenericDetailsSheet
      objectType={objectType}
      form={form}
      data={undefined}
      isFetching={false}
      isCreateMode={isOpen}
      entityId={null}
      onClose={onClose}
      createMutation={createMutation}
      updateMutation={updateMutation}
      buildPayload={async (data) => ({ ...data, ...initialData })}
      renderFields={(props: RemediationFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers)}
    />
  )
}

export default CreateRemediationSheet
