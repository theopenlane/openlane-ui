'use client'

import React, { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, IdentityHolderQuery, UpdateIdentityHolderInput, CreateIdentityHolderInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import {
  useUpdateIdentityHolder,
  useCreateIdentityHolder,
  useBulkDeleteIdentityHolder,
  useCreateBulkCSVIdentityHolder,
  useBulkEditIdentityHolder,
  useIdentityHolder,
  useGetIdentityHolderAssociations,
  IdentityHoldersNodeNonNull,
} from '@/lib/graphql-hooks/identity-holder'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { PersonnelSheetConfig, PersonnelTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting, PersonnelFieldProps } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

const normalizeData = (data: IdentityHolderQuery['identityHolder']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const PersonnelPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useIdentityHolder(id || undefined)
  const { data: associationsData } = useGetIdentityHolderAssociations(id || undefined)
  const initialAssociationsRef = useRef<TObjectAssociationMap>({})

  useEffect(() => {
    if (associationsData?.identityHolder) {
      initialAssociationsRef.current = {
        assetIDs: (associationsData.identityHolder.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        entityIDs: (associationsData.identityHolder.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        campaignIDs: (associationsData.identityHolder.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        taskIDs: (associationsData.identityHolder.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      }
    }
  }, [associationsData])

  function getName(data: IdentityHoldersNodeNonNull) {
    return data?.fullName
  }

  const baseUpdateMutation = useUpdateIdentityHolder()
  const baseCreateMutation = useCreateIdentityHolder()
  const baseBulkDeleteMutation = useBulkDeleteIdentityHolder()
  const baseBulkCreateMutation = useCreateBulkCSVIdentityHolder()
  const baseBulkEditMutation = useBulkEditIdentityHolder()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateIdentityHolderInput }) => baseUpdateMutation.mutateAsync({ updateIdentityHolderId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateIdentityHolderInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkIdentityHolder.deletedIDs
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const statusOptions = Object.values(IdentityHolderUserStatus).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const identityHolderTypeOptions = Object.values(IdentityHolderIdentityHolderType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { tagOptions } = useGetTags()

  const enumOpts = {
    statusOptions,
    identityHolderTypeOptions,
    environmentOptions,
    scopeOptions,
    tagOptions,
  }

  const sheetConfig: PersonnelSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.identityHolder : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      const { assetIDs, entityIDs, campaignIDs, taskIDs, internalOwner, ...rest } = data

      const associationFields: Record<string, string[] | undefined> = { assetIDs, entityIDs, campaignIDs, taskIDs }
      let associationPayload: Record<string, string[]> = {}

      if (isCreate) {
        Object.entries(associationFields).forEach(([key, ids]) => {
          if (ids?.length) associationPayload[key] = ids
        })
      } else {
        const currentAssociations: TObjectAssociationMap = {}
        Object.entries(associationFields).forEach(([key, ids]) => {
          if (ids) currentAssociations[key] = ids
        })
        if (Object.keys(currentAssociations).length > 0) {
          associationPayload = getAssociationInput(initialAssociationsRef.current, currentAssociations)
        }
      }

      return {
        ...rest,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: isCreate ? 'create' : 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: PersonnelFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: PersonnelTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['fullNameContainsFold', 'emailContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateIdentityHolderInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default PersonnelPage
