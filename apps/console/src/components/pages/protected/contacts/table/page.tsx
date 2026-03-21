'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

import { type ContactsNodeNonNull, useContact, useUpdateContact, useCreateContact, useBulkDeleteContact, useCreateBulkCSVContact, useBulkEditContact } from '@/lib/graphql-hooks/contact'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type ContactSheetConfig, type ContactTablePageConfig, type ContactFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { ContactUserStatus, type CreateContactInput, type UpdateContactInput } from '@repo/codegen/src/schema'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const ContactPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useContact(id || undefined)

  const getName = (data: ContactsNodeNonNull) => {
    return data?.fullName
  }

  const baseUpdateMutation = useUpdateContact()
  const baseCreateMutation = useCreateContact()
  const baseBulkDeleteMutation = useBulkDeleteContact()
  const baseBulkCreateMutation = useCreateBulkCSVContact()
  const baseBulkEditMutation = useBulkEditContact()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateContactInput }) => baseUpdateMutation.mutateAsync({ updateContactId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateContactInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkContact.deletedIDs
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

  const statusOptions = Object.values(ContactUserStatus).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { tagOptions } = useGetTags()

  const enumOpts = {
    statusOptions,
    tagOptions,
  }

  const sheetConfig: ContactSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.contact : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      return { ...data }
    },
    getName,
    renderFields: (props: ContactFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: ContactTablePageConfig = {
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
    onBulkEdit: async (ids: string[], input: UpdateContactInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ContactPage
