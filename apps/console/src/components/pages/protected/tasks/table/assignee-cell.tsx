import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { User } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { useUpdateTask } from '@/lib/graphql-hooks/task'
import EditableUserCell from '@/components/shared/editable-user-cell/editable-user-cell'

type TAssigneeCellProps = {
  assignee?: User | null
  taskId: string
}

const AssigneeCell: React.FC<TAssigneeCellProps> = ({ assignee, taskId }) => {
  const { mutateAsync: updateTask } = useUpdateTask()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateTask({
        updateTaskId: taskId,
        input: {
          assigneeID: data.id,
          clearAssignee: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['procedures'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableUserCell label="Task" entity={assignee} onSubmitData={handleSubmitData} placeholder="Not assigned" />
}

export default AssigneeCell
