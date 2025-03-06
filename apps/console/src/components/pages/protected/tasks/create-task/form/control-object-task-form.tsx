'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { TASK_OBJECT_TASK_CONFIG, TaskObjectTypes } from '@/components/pages/protected/tasks/util/task'
import debounce from 'lodash.debounce'
import { useQuery } from 'urql'
import { TFormDataResponse } from '@/components/pages/protected/tasks/create-task/form/types/TFormDataResponse'
import { GetAllControlsDocument } from '@repo/codegen/src/schema'
import { UseFormReturn } from 'react-hook-form'
import { CreateTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import TaskObjectTypeTable from '@/components/pages/protected/tasks/create-task/form/task-object-type-table'
import { TTaskObjectType } from '@/components/pages/protected/tasks/create-task/form/types/TTaskObjectType'

type TProps = {
  form: UseFormReturn<CreateTaskFormData>
}

const ControlObjectTaskForm: React.FC<TProps> = (props: TProps) => {
  const [selectedObject, setSelectedObject] = useState<TaskObjectTypes | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [formData, setFormData] = useState<TFormDataResponse[]>([])
  const options = Object.values(TaskObjectTypes)
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const debouncedSetSearchValue = useCallback(
    debounce((value) => setDebouncedSearchValue(value), 300),
    [],
  )
  const selectedQuery = selectedObject && TASK_OBJECT_TASK_CONFIG[selectedObject].queryDocument
  const objectKey = selectedObject && TASK_OBJECT_TASK_CONFIG[selectedObject]?.responseObjectKey
  const inputName = selectedObject && TASK_OBJECT_TASK_CONFIG[selectedObject]?.inputName
  const inputPlaceholder = selectedObject && TASK_OBJECT_TASK_CONFIG[selectedObject]?.placeholder

  const whereFilter = {
    ...(objectKey === 'tasks' ? { titleContainsFold: debouncedSearchValue } : { nameContainsFold: debouncedSearchValue }),
  }
  const [{ data }] = useQuery({
    query: selectedQuery || GetAllControlsDocument,
    variables: { where: whereFilter },
    pause: !selectedQuery,
  })

  useEffect(() => {
    if (objectKey && data) {
      const updatedData =
        data[objectKey]?.edges.map((item: any) => {
          return {
            id: item?.node?.id,
            name: item?.node?.name,
            description: item?.node?.description,
            inputName: inputName,
          }
        }) || []

      setFormData(updatedData)
    }
  }, [data!!, objectKey])

  useEffect(() => {
    resetState()
  }, [selectedObject])

  const resetState = () => {
    setSearchValue('')
    setDebouncedSearchValue('')
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchValue(event.target.value)
    setSearchValue(event.target.value)
  }

  const handleTaskObjectTypeChange = (taskObjectTypes: TTaskObjectType[]) => {
    props.form.setValue('taskObjects', taskObjectTypes)
  }

  return (
    <Panel>
      <PanelHeader heading="Associate this task with other object" noBorder />
      <p>If the assigned team member has access to the object, you can see it bellow.</p>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Select Object</Label>
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
      <TaskObjectTypeTable onTaskObjectTypeChange={handleTaskObjectTypeChange} data={formData} form={props.form} />
    </Panel>
  )
}

export default ControlObjectTaskForm
