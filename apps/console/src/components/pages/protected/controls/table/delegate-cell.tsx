import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { useUpdateControl } from '@/lib/graphql-hooks/control'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'

type TDelegateCellProps = {
  delegate?: Group | null
  controlId: string
}

const DelegateCell: React.FC<TDelegateCellProps> = ({ delegate, controlId }) => {
  const { mutateAsync: updateControl } = useUpdateControl()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateControl({
        updateControlId: controlId,
        input: {
          delegateID: data.id,
          clearDelegate: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['controls'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Control" entity={delegate} onSubmitData={handleSubmitData} placeholder="No delegate" />
}

export default DelegateCell
