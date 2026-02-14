'use client'
import React from 'react'
import { Group } from '@repo/codegen/src/schema'
import { useUpdateControl } from '@/lib/graphql-hooks/control'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'
import { QueryClient } from '@tanstack/react-query'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TOwnerCellProps = {
  owner?: Group | null
  controlId: string
}

const OwnerCell: React.FC<TOwnerCellProps> = ({ owner, controlId }) => {
  const { mutateAsync: updateControl } = useUpdateControl()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateControl({
        updateControlId: controlId,
        input: {
          controlOwnerID: data.id,
          clearControlOwner: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['controls'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Control" entity={owner} onSubmitData={handleSubmitData} placeholder="No owner" />
}

export default OwnerCell
