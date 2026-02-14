import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedure'

type TDelegateCellProps = {
  delegate?: Group | null
  procedureId: string
}

const DelegateCell: React.FC<TDelegateCellProps> = ({ delegate, procedureId }) => {
  const { mutateAsync: updateProcedure } = useUpdateProcedure()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateProcedure({
        updateProcedureId: procedureId,
        input: {
          delegateID: data.id,
          clearDelegate: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['procedures'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Procedure" entity={delegate} onSubmitData={handleSubmitData} placeholder="No delegate" />
}

export default DelegateCell
