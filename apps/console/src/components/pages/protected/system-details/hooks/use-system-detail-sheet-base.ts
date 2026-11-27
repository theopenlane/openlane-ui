'use client'

import { type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { type SystemDetailsNodeNonNull, useBulkDeleteSystemDetail, useSystemDetail, useUpdateSystemDetail } from '@/lib/graphql-hooks/system-detail'
import { getFieldsToRender } from '../table/table-config'
import { objectType, type SystemDetailFieldProps } from '../table/types'
import { normalizeSystemDetail, SYSTEM_DETAIL_UPDATE_FIELDS } from './system-detail-update-fields'
import useFormSchema from './use-form-schema'
import { useSystemDetailEnumOptions } from './use-system-detail-enum-options'

const getName = (systemDetail: SystemDetailsNodeNonNull) => systemDetail?.systemName

export const useSystemDetailSheetBase = (systemDetailId: string | undefined) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useSystemDetail(systemDetailId)
  const updateMutation = useUpdateSystemDetail()
  const deleteMutation = useBulkDeleteSystemDetail()
  const { enumOpts, hasProgramAccess } = useSystemDetailEnumOptions()

  return {
    enumOpts,
    hasProgramAccess,
    sheetBase: {
      objectType,
      form,
      data: systemDetailId ? data?.systemDetail : undefined,
      isFetching: isLoading,
      update: {
        mutation: {
          isPending: updateMutation.isPending,
          mutateAsync: async (params: { id: string; input: UpdateSystemDetailInput }) => updateMutation.mutateAsync({ updateSystemDetailId: params.id, input: params.input }),
        },
        fields: SYSTEM_DETAIL_UPDATE_FIELDS,
      },
      deleteMutation: {
        isPending: deleteMutation.isPending,
        mutateAsync: async (params: { ids: string[] }) => (await deleteMutation.mutateAsync({ ids: params.ids })).deleteBulkSystemDetail,
      },
      normalizeData: normalizeSystemDetail,
      getName,
      renderFields: (props: SystemDetailFieldProps) => getFieldsToRender(props, enumOpts),
    },
  }
}
