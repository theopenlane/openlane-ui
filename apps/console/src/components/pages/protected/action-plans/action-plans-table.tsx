'use client'

import React, { useCallback } from 'react'
import useFormSchema, { bulkEditFieldSchema } from './hooks/use-form-schema'
import {
  type ActionPlansNodeNonNull,
  useActionPlan,
  useCreateActionPlan,
  useUpdateActionPlan,
  useBulkDeleteActionPlan,
  useBulkEditActionPlan,
  useCreateBulkCSVActionPlan,
} from '@/lib/graphql-hooks/action-plan'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table/table-config'
import { type ActionPlanSheetConfig, type ActionPlanTablePageConfig, type ActionPlanFieldProps, objectType, objectName, tableKey, orderFieldEnum, defaultSorting } from './table/types'
import { getColumns } from './table/columns'
import TableComponent from './table/table'
import { type CreateActionPlanInput, type UpdateActionPlanInput, type ActionPlanWhereInput } from '@repo/codegen/src/schema'
import { useSearchParams } from 'next/navigation'

type Props = {
  additionalWhereFilter?: Partial<ActionPlanWhereInput>
  createInitialPayload?: Partial<CreateActionPlanInput>
}

const ActionPlansTable: React.FC<Props> = ({ additionalWhereFilter, createInitialPayload }) => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useActionPlan(id || undefined)

  const getName = useCallback((actionPlan: ActionPlansNodeNonNull) => {
    return actionPlan?.name || actionPlan?.title
  }, [])

  const baseUpdateMutation = useUpdateActionPlan()
  const baseCreateMutation = useCreateActionPlan()
  const baseBulkCreateMutation = useCreateBulkCSVActionPlan()
  const baseBulkDeleteMutation = useBulkDeleteActionPlan()
  const baseBulkEditMutation = useBulkEditActionPlan()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateActionPlanInput }) => baseUpdateMutation.mutateAsync({ updateActionPlanId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateActionPlanInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkActionPlan.deletedIDs
    },
  }

  const sheetConfig: ActionPlanSheetConfig = {
    objectType,
    form,
    data: id ? data?.actionPlan : undefined,
    isFetching: isLoading,
    buildPayload: async (formData) => {
      if (isCreate && createInitialPayload) {
        return { ...createInitialPayload, ...formData }
      }
      return { ...formData }
    },
    getName,
    updateMutation,
    createMutation,
    deleteMutation,
    renderFields: (props: ActionPlanFieldProps) => getFieldsToRender(props),
  }

  const tableConfig: ActionPlanTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(),
    searchFields: ['nameContainsFold', 'titleContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    additionalWhereFilter,
    onBulkDelete: async (ids: string[]) => {
      await baseBulkDeleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await baseBulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateActionPlanInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ActionPlansTable
