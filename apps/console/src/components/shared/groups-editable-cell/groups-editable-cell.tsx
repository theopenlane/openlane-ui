'use client'
import React, { useState } from 'react'
import { Controller, Form } from 'react-hook-form'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient, QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Option } from '@repo/ui/multiple-selector'
import { Check, Building2, X } from 'lucide-react'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import useEditableFieldFormSchema, { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'

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

  const groups = groupsData?.groups?.edges?.map((edge) => edge?.node) || []
  const options: Option[] = groups.map((g) => ({ label: g?.displayName || g?.name || '', value: g?.id || '' }))
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
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
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
                    <Building2 width={28} height={28} className="inline-block mr-1 dark:!text-separator-edit-dark text-separator-edit" />
                    <span className="dark:!text-separator-edit-dark text-separator-edit">{placeholder}</span>
                  </>
                )}
              </p>
              <span className="absolute bottom-[-5px] left-0 right-0 border-b-2 border-dashed dark:!border-separator-edit-dark border-separator-edit pointer-events-none" />
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center space-x-2 w-full">
            <div className="flex items-center w-full">
              <Controller
                name="id"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select value={field.value || 'unassigned'} onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)}>
                      <SelectTrigger className="w-full">{options.find((opt) => opt.value === field.value)?.label || 'Select'}</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{placeholder}</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="w-full">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.id && <p className="text-red-500 text-sm pl-1">{form.formState.errors.id.message}</p>}
                  </>
                )}
              />
            </div>

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
                  setIsEditing(false)
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

export default EditableGroupCell
