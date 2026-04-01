'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema from '../hooks/use-form-schema'

import { PlatformPlatformStatus, type UpdatePlatformInput, type CreatePlatformInput } from '@repo/codegen/src/schema'
import { type EditPlatformFormData } from '../hooks/use-form-schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatePlatform, useUpdatePlatform, useDeletePlatform } from '@/lib/graphql-hooks/platform'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type PlatformSheetConfig, type PlatformTablePageConfig, objectType, objectName, displayName, tableKey, orderFieldEnum, defaultSorting } from './types'
import { createPlatformSteps } from '../create/steps/platform-create-steps'
import { getColumns } from './columns'
import TableComponent from './table'

const PlatformPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const baseUpdateMutation = useUpdatePlatform()
  const baseCreateMutation = useCreatePlatform()
  const baseDeleteMutation = useDeletePlatform()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdatePlatformInput }) => baseUpdateMutation.mutateAsync({ updatePlatformId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreatePlatformInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const deleteMutation = {
    isPending: baseDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const results = await Promise.all(params.ids.map((id) => baseDeleteMutation.mutateAsync({ deletePlatformId: id })))
      return results.map((r) => r.deletePlatform.deletedID)
    },
  }

  const { enumOptions: environmentOptions, onCreateOption: _createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: _createScope } = useCreatableEnumOptions({ field: 'scope' })
  const statusOptions = enumToOptions(PlatformPlatformStatus)

  const enumOpts = {
    statusOptions,
    environmentOptions,
    scopeOptions,
  }

  const sheetConfig: PlatformSheetConfig = {
    objectType,
    displayName,
    form,
    data: id ? undefined : undefined,
    isFetching: false,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { businessOwner, technicalOwner, ...rest } = data
      return {
        ...rest,
        ...buildResponsibilityPayload('businessOwner', businessOwner, { mode: isCreate ? 'create' : 'update' }),
        ...buildResponsibilityPayload('technicalOwner', technicalOwner, { mode: isCreate ? 'create' : 'update' }),
      } as CreatePlatformInput
    },
    normalizeData: (data) => ({ ...data }) as Partial<EditPlatformFormData>,
    getName: (data) => data?.name ?? '',
    renderFields: () => <div />,
  }

  const platformCreateSteps = useMemo(() => createPlatformSteps(), [])

  const tableConfig: PlatformTablePageConfig = {
    objectType,
    objectName,
    displayName,
    tableKey,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['nameContainsFold', 'businessPurposeContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    viewEditMode: { type: 'full-page', route: '/registry/platforms' },
    createMode: { type: 'step-dialog', steps: platformCreateSteps, title: 'Create Platform' },
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    enumOpts,
    responsibilityFields: {
      businessOwner: { fieldBaseName: 'businessOwner' },
      technicalOwner: { fieldBaseName: 'technicalOwner' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default PlatformPage
