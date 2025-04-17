'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { AllQueriesData, TASK_OBJECT_TASK_CONFIG, TaskObjectTypes } from '@/components/pages/protected/tasks/util/task'
import { TFormDataResponse } from '@/components/pages/protected/tasks/create-task/form/types/TFormDataResponse'
import { UseFormReturn } from 'react-hook-form'
import { CreateTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import TaskObjectTypeTable from '@/components/pages/protected/tasks/create-task/form/task-object-type-table'
import { TTaskObjectType } from '@/components/pages/protected/tasks/create-task/form/types/TTaskObjectType'
import { useQuery } from '@tanstack/react-query'
import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder.tsx'
import { useDebounce } from '@uidotdev/usehooks'

type TProps = {
  form: UseFormReturn<CreateTaskFormData>
}

const ControlObjectTaskForm: React.FC<TProps> = (props: TProps) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<TaskObjectTypes | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [formData, setFormData] = useState<TFormDataResponse[]>([])
  const options = Object.values(TaskObjectTypes)
  const debouncedSearchValue = useDebounce(searchValue, 300)

  const selectedConfig = selectedObject ? TASK_OBJECT_TASK_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument
  const objectKey = selectedConfig?.responseObjectKey
  const inputName = selectedConfig?.inputName
  const inputPlaceholder = selectedConfig?.placeholder
  const searchAttribute = selectedConfig?.searchAttribute
  const objectName = selectedConfig?.objectName!

  const { data } = useQuery<AllQueriesData>({
    queryKey: ['assignPermissionCustom', { debouncedSearchValue, selectedObject }],
    queryFn: () =>
      client.request(selectedQuery || GET_ALL_CONTROLS, {
        where: {
          ...(searchAttribute && debouncedSearchValue ? { [searchAttribute]: debouncedSearchValue } : {}),
        },
      }),
    enabled: !!selectedQuery,
  })

  useEffect(() => {
    if (objectKey && data) {
      const objectDataList = objectKey && data?.[objectKey]?.edges ? data[objectKey].edges : []
      const updatedData =
        (objectDataList.map((item: any) => {
          return {
            id: item?.node?.id,
            name: item?.node[objectName] || '',
            details: item?.node?.description,
            inputName: inputName,
          }
        }) as TFormDataResponse[]) || []

      setFormData(updatedData)
    }
  }, [data!!, objectKey])

  useEffect(() => {
    resetState()
  }, [selectedObject])

  const resetState = () => {
    setSearchValue('')
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  const handleTaskObjectTypeChange = (taskObjectTypes: TTaskObjectType[]) => {
    props.form.setValue('taskObjects', taskObjectTypes)
  }

  return (
    <Panel>
      <PanelHeader heading="Object association" noBorder />
      <p>Associating objects will allow users with access to the object to see the created task.</p>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Object type</Label>
          <Select
            onValueChange={(val: TaskObjectTypes) => {
              setSelectedObject(val)
            }}
          >
            <SelectTrigger className=" w-full">{selectedObject || 'Select object'}</SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <Input
            disabled={!selectedQuery}
            onChange={handleSearchChange}
            value={searchValue}
            placeholder={inputPlaceholder ? `Type ${inputPlaceholder} name` : 'Select object first'}
            className="h-10 w-full"
          />
        </div>
      </div>
      {selectedObject && <TaskObjectTypeTable onTaskObjectTypeChange={handleTaskObjectTypeChange} data={formData} form={props.form} />}
      {!selectedObject && (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
    </Panel>
  )
}

export default ControlObjectTaskForm
