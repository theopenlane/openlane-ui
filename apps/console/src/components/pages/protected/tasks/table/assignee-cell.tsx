import React, { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { useUpdateTask } from '@/lib/graphql-hooks/tasks.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore.ts'
import { Form } from '@repo/ui/form'
import useAssigneeFormSchema, { EditTaskAssigneeFormData } from '@/components/pages/protected/tasks/hooks/use-assignee-form-schema.ts'
import { Check, Pencil, X } from 'lucide-react'

type TProps = {
  assignee?: User
  taskId: number
}

const AssigneeCell: React.FC<TProps> = (props: TProps) => {
  const { form } = useAssigneeFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { mutateAsync: updateTask } = useUpdateTask()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const { orgMembers } = useTaskStore()

  const firstName = props.assignee?.firstName
  const lastName = props.assignee?.lastName
  const displayName = props.assignee?.displayName

  const fullName = !firstName && !lastName ? displayName : `${firstName ?? ''} ${lastName ?? ''}`

  const onSubmit = async (data: EditTaskAssigneeFormData) => {
    try {
      await updateTask({
        updateTaskId: props.taskId.toString(),
        input: {
          assigneeID: data?.assigneeID,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['task'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task assignee has been successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="flex items-center space-x-1">
      {!isEditing ? (
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <div
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="flex items-center cursor-pointer"
          >
            <Avatar entity={props.assignee} />
            <div className="flex items-center pl-1 space-x-1">
              <p>{fullName}</p>
              <Pencil size={18} className="pl-1 cursor-pointer" />
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center space-x-2 w-full">
            <div className="flex items-center w-full">
              <Controller
                name="assigneeID"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">{(orgMembers || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                      <SelectContent>
                        {orgMembers &&
                          orgMembers.length > 0 &&
                          orgMembers.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="w-full">
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.assigneeID && <p className="text-red-500 text-sm">{form.formState.errors.assigneeID.message}</p>}
                  </>
                )}
              />
            </div>

            {/* Actions section */}
            <div className="flex items-center justify-center space-x-2">
              <Check
                size={18}
                onClick={(e) => {
                  e.stopPropagation()
                  form.handleSubmit(onSubmit)()
                }}
                className="cursor-pointer text-green-500"
              />
              <X
                size={18}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancel()
                }}
                className="cursor-pointer text-red-500"
              />
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

export default AssigneeCell
