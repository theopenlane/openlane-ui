import React from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { type AvatarEntityLike } from '@/components/shared/avatar/avatar'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCanEditRows } from '@/lib/authz/use-can-edit-rows'
import { type EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { useUpdateTask } from '@/lib/graphql-hooks/task'
import EditableUserCell from '@/components/shared/editable-user-cell/editable-user-cell'

type TAssigneeCellProps = {
  assignee?: AvatarEntityLike | null
  taskId: string
}

const AssigneeCell: React.FC<TAssigneeCellProps> = ({ assignee, taskId }) => {
  const canEdit = useCanEditRows()
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
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableUserCell label="Task" entity={assignee} onSubmitData={handleSubmitData} placeholder="Not assigned" canEdit={canEdit} />
}

export default AssigneeCell
