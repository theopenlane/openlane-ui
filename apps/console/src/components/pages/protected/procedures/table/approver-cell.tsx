import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedure'

type TApproverCellProps = {
  approver?: Group | null
  procedureId: string
}

const ApproverCell: React.FC<TApproverCellProps> = ({ approver, procedureId }) => {
  const { mutateAsync: updateProcedure } = useUpdateProcedure()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateProcedure({
        updateProcedureId: procedureId,
        input: {
          approverID: data.id,
          clearApprover: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['procedures'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Procedure" entity={approver} onSubmitData={handleSubmitData} placeholder="No approver" />
}

export default ApproverCell
