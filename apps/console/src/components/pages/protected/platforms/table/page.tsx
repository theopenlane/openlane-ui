'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema from '../hooks/use-form-schema'

import { PlatformPlatformStatus, type UpdatePlatformInput, type CreatePlatformInput } from '@repo/codegen/src/schema'
import { type EditPlatformFormData } from '../hooks/use-form-schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatePlatform, useUpdatePlatform, useDeletePlatform } from '@/lib/graphql-hooks/platform'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type PlatformSheetConfig, type PlatformTablePageConfig, objectType, objectName, displayName, tableKey, orderFieldEnum, defaultSorting } from './types'
import { createPlatformSteps } from '../create/steps/platform-create-steps'
import { getColumns } from './columns'
import TableComponent from './table'

const PlatformPage: React.FC = () => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const { data: session } = useSession()

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
      return {
        deletedIDs: results.map((r) => r.deletePlatform.deletedID),
        notDeletedIDs: [],
      }
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
      const { businessOwner, technicalOwner, platformOwner, entityIDs: _e, outOfScopeVendorIDs: _ov, assetIDs: _a, outOfScopeAssetIDs: _oa, ...rest } = data
      const [businessPurpose, dataFlowSummary, trustBoundaryDescription] = await Promise.all([
        rest.businessPurpose ? plateEditorHelper.convertToHtml(rest.businessPurpose as Value) : undefined,
        rest.dataFlowSummary ? plateEditorHelper.convertToHtml(rest.dataFlowSummary as Value) : undefined,
        rest.trustBoundaryDescription ? plateEditorHelper.convertToHtml(rest.trustBoundaryDescription as Value) : undefined,
      ])
      return {
        name: rest.name,
        status: rest.status,
        scopeName: rest.scopeName,
        environmentName: rest.environmentName,
        containsPii: rest.containsPii,
        businessPurpose,
        dataFlowSummary,
        trustBoundaryDescription,
        // Default to the current user when no owner explicitly selected — backend requires this for authorization
        platformOwnerID: platformOwner?.type === 'user' ? platformOwner.value : isCreate ? (session?.user?.id ?? undefined) : undefined,
        ...buildResponsibilityPayload('businessOwner', businessOwner, { mode: isCreate ? 'create' : 'update' }),
        ...buildResponsibilityPayload('technicalOwner', technicalOwner, { mode: isCreate ? 'create' : 'update' }),
      } as CreatePlatformInput
    },
    normalizeData: (data) => {
      const { platformOwnerID, ...rest } = data as Record<string, unknown>
      return {
        ...rest,
        platformOwner: platformOwnerID ? { type: 'user' as const, value: platformOwnerID as string } : undefined,
      } as Partial<EditPlatformFormData>
    },
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
    createMode: { type: 'step-dialog', steps: platformCreateSteps, title: 'Create Platform', dialogClassName: 'sm:max-w-2xl' },
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    enumOpts,
    responsibilityFields: {
      businessOwner: { fieldBaseName: 'businessOwner' },
      technicalOwner: { fieldBaseName: 'technicalOwner' },
      platformOwner: { fieldBaseName: 'platformOwner' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default PlatformPage
