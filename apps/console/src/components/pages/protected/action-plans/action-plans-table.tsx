'use client'

import React, { useCallback, useMemo } from 'react'
import useFormSchema, { bulkEditFieldSchema } from './hooks/use-form-schema'
import { type ActionPlansNodeNonNull, useActionPlan, useCreateActionPlan, useUpdateActionPlan, useBulkDeleteActionPlan, useBulkEditActionPlan } from '@/lib/graphql-hooks/action-plan'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, mapActionPlanFilterKey, visibilityFields } from './table/table-config'
import { useResponsibilityFilterOptions } from '@/components/shared/table-filter/use-responsibility-filter-options'
import { type ActionPlanSheetConfig, type ActionPlanTablePageConfig, type ActionPlanFieldProps, objectType, objectName, tableKey, orderFieldEnum, defaultSorting } from './table/types'
import { getColumns } from './table/columns'
import TableComponent from './table/table'
import { type CreateActionPlanInput, type UpdateActionPlanInput, type ActionPlanWhereInput, ActionPlanDocumentStatus, ActionPlanPriority } from '@repo/codegen/src/schema'
import { useSearchParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { ACTION_PLAN_UPDATE_FIELDS } from './hooks/action-plan-update-fields'
import { ACTION_PLAN_INTERNAL_OWNER, buildActionPlanCreatePayload, normalizeActionPlanData } from './action-plan-form-data'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

type Props = {
  additionalWhereFilter?: Partial<ActionPlanWhereInput>
  createInitialPayload?: Partial<CreateActionPlanInput>
  hideCreate?: boolean
  hideBreadcrumbs?: boolean
}

const ActionPlansTable: React.FC<Props> = ({ additionalWhereFilter, createInitialPayload, hideCreate, hideBreadcrumbs }) => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useActionPlan(id || undefined)

  const getName = useCallback((actionPlan: ActionPlansNodeNonNull) => {
    return actionPlan?.name || actionPlan?.title
  }, [])

  const internalOwnerOptions = useResponsibilityFilterOptions()
  const filterFields = useMemo(() => getFilterFields(internalOwnerOptions), [internalOwnerOptions])

  const baseUpdateMutation = useUpdateActionPlan()
  const baseCreateMutation = useCreateActionPlan()
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
      return result.deleteBulkActionPlan
    },
  }

  const sheetConfig: ActionPlanSheetConfig = {
    objectType,
    form,
    data: id ? data?.actionPlan : undefined,
    isFetching: isLoading,
    normalizeData: normalizeActionPlanData,
    buildPayload: (formData) => buildActionPlanCreatePayload(formData, { createInitialPayload, converter: plateEditorHelper }),
    updateFields: ACTION_PLAN_UPDATE_FIELDS,
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
    filterFields,
    mapFilterKey: mapActionPlanFilterKey,
    searchFields: ['nameContainsFold', 'titleContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    additionalWhereFilter,
    hideCreate,
    hideBreadcrumbs,
    onBulkDelete: async (ids: string[]) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkActionPlan
    },
    onBulkEdit: async (ids: string[], input: UpdateActionPlanInput) => {
      const result = await baseBulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkActionPlan
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    responsibilityFields: { internalOwner: ACTION_PLAN_INTERNAL_OWNER },
    enumOpts: {
      statusOptions: enumToOptions(ActionPlanDocumentStatus),
      priorityOptions: enumToOptions(ActionPlanPriority),
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default ActionPlansTable
