import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'

type TDelegateCellProps = {
  delegate?: Group | null
  policyId: string
}

const DelegateCell: React.FC<TDelegateCellProps> = ({ delegate, policyId }) => {
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updatePolicy({
        updateInternalPolicyId: policyId,
        input: {
          delegateID: data.id,
          clearDelegate: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Policy" entity={delegate} onSubmitData={handleSubmitData} placeholder="No delegate" />
}

export default DelegateCell
