'use client'

import React from 'react'
import useFormSchema from './hooks/use-form-schema'
import { type ActionPlansNodeNonNull, useActionPlan, useCreateActionPlan, useUpdateActionPlan, useBulkDeleteActionPlan } from '@/lib/graphql-hooks/action-plan'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from './table/table-config'
import { type ActionPlanSheetConfig, type ActionPlanFieldProps, objectType } from './table/types'
import { type CreateActionPlanInput, type UpdateActionPlanInput } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'

type Props = {
  entityId: string | null
  onClose: () => void
  createInitialPayload?: Partial<CreateActionPlanInput>
}

const ViewActionPlanSheet: React.FC<Props> = ({ entityId, onClose, createInitialPayload }) => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const { data, isLoading } = useActionPlan(entityId || undefined)

  const baseUpdateMutation = useUpdateActionPlan()
  const baseCreateMutation = useCreateActionPlan()
  const baseBulkDeleteMutation = useBulkDeleteActionPlan()

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

  const getName = (d: ActionPlansNodeNonNull) => {
    return d?.name || d?.title
  }

  const sheetConfig: ActionPlanSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: !entityId,
    data: entityId ? data?.actionPlan : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    onClose,
    buildPayload: async (formData) => {
      const description = formData.descriptionJSON ? await plateEditorHelper.convertToHtml(formData.descriptionJSON as Value) : undefined
      const payload = { ...formData, description, descriptionJSON: undefined }
      if (!entityId && createInitialPayload) {
        return { ...createInitialPayload, ...payload }
      }
      return { ...payload }
    },
    getName,
    renderFields: (props: ActionPlanFieldProps) => getFieldsToRender(props),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewActionPlanSheet
