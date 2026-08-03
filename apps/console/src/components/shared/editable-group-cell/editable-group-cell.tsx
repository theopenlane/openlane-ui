'use client'
import React, { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { type Group } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Form } from '@repo/ui/form'
import { type Option } from '@repo/ui/multiple-selector'
import { CircleUser } from 'lucide-react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import useEditableFieldFormSchema, { UNASSIGNED, type EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'

type EditableGroupCellProps = {
  label: string
  entity?: Group | null
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

const EditableGroupCell: React.FC<EditableGroupCellProps> = ({ label, entity, onSubmitData, placeholder = 'No value' }) => {
  const { form } = useEditableFieldFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: isEditing })

  const options: Option[] = useMemo(
    () => [
      { label: placeholder, value: UNASSIGNED },
      ...(groupsData?.groups?.edges?.flatMap((edge) => (edge?.node?.id ? [{ label: edge.node.displayName || edge.node.name, value: edge.node.id }] : [])) ?? []),
    ],
    [groupsData, placeholder],
  )

  const entityName = entity?.displayName

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
              {entityName ? (
                entityName
              ) : (
                <>
                  <CircleUser width={16} height={16} className="inline-block mr-1 dark:!text-separator-edit-dark text-separator-edit" />
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
            <div className="flex items-center w-full max-w-md">
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
                      <SelectTrigger className="w-full min-w-[150px]">{options.find((opt) => opt.value === selectedValue)?.label || 'Select'}</SelectTrigger>
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

export default EditableGroupCell
