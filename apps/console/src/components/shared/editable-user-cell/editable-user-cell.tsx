import React, { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { useNotification } from '@/hooks/useNotification.tsx'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { type AvatarEntityLike } from '@/components/shared/avatar/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore.ts'
import { Form } from '@repo/ui/form'
import { CircleUser } from 'lucide-react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import useEditableFieldFormSchema, { UNASSIGNED, type EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { type Option } from '@repo/ui/multiple-selector'

type EditableUserCellProps = {
  label: string
  entity?: AvatarEntityLike | null
  onSubmitData: (
    data: EditableFieldFormData,
    helpers: {
      queryClient: QueryClient
      notifySuccess: () => void
      notifyError: (msg: string) => void
    },
  ) => Promise<void>
  placeholder?: string
}

const EditableUserCell: React.FC<EditableUserCellProps> = ({ label, entity, onSubmitData, placeholder = 'No value' }) => {
  const { form } = useEditableFieldFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const orgMembers = useTaskStore((state) => state.orgMembers)
  const fullName = entity?.displayName

  const options: Option[] = useMemo(
    () => [
      { label: placeholder, value: UNASSIGNED },
      ...(orgMembers?.map((member) => ({
        label: member.label,
        value: member.value,
      })) ?? []),
    ],
    [orgMembers, placeholder],
  )

  const onSubmit = async (data: EditableFieldFormData) => {
    try {
      await onSubmitData(data, {
        queryClient,
        notifySuccess: () =>
          successNotification({
            title: `${label} updated`,
            description: `${label} has been successfully updated.`,
          }),
        notifyError: (msg) =>
          errorNotification({
            title: 'Error',
            description: msg,
          }),
      })
    } catch (err) {
      const message = parseErrorMessage(err)
      errorNotification({ title: 'Error', description: message })
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center space-x-1">
      {!isEditing ? (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          className="flex items-center cursor-pointer"
        >
          <div className="flex items-center space-x-1 relative">
            <Avatar entity={entity} className="w-[28px] h-[28px]" />
            <p className="flex items-center">
              {fullName ? (
                fullName
              ) : (
                <>
                  <CircleUser width={30} height={30} className="inline-block mr-1 dark:!text-separator-edit-dark text-separator-edit" />
                  <span className="dark:!text-separator-edit-dark text-separator-edit">{placeholder}</span>
                </>
              )}
            </p>
            <span className="absolute bottom-[-5px] left-0 right-0 border-b-2 border-dashed dark:!border-separator-edit-dark border-separator-edit pointer-events-none" />
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={form.handleSubmit(onSubmit)} className="flex items-center space-x-2 w-full">
            <div className="flex items-center w-full">
              <Controller
                name="id"
                control={form.control}
                render={({ field }) => {
                  const selectedValue = field.value ?? undefined
                  return (
                    <Select
                      value={selectedValue}
                      onValueChange={async (value) => {
                        const newValue = value === UNASSIGNED ? null : value
                        field.onChange(newValue)
                        await onSubmit({ ...form.getValues(), id: newValue })
                      }}
                    >
                      <SelectTrigger className="w-full">{options.find((member) => member.value === selectedValue)?.label || 'Select'}</SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="w-full">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

export default EditableUserCell
