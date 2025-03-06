'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TFormDataResponse } from '@/components/pages/protected/tasks/create-task/form/types/TFormDataResponse'
import { TTaskObjectType } from '@/components/pages/protected/tasks/create-task/form/types/TTaskObjectType'
import { UseFormReturn } from 'react-hook-form'
import { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'

type TProps = {
  data: TFormDataResponse[]
  onTaskObjectTypeChange: (taskObjectTypes: TTaskObjectType[]) => void
  form?: UseFormReturn<EditTaskFormData>
}

const TaskObjectTypeTable: React.FC<TProps> = (props: TProps) => {
  const [taskObjectTypes, setTaskObjectTypes] = useState<TTaskObjectType[]>(
    props.form
      ? [
          ...(props.form.getValues('controlObjectiveIDs')?.length ? [{ inputName: 'controlObjectiveIDs', objectIds: props.form.getValues('controlObjectiveIDs') || [] }] : []),
          ...(props.form.getValues('subcontrolIDs')?.length ? [{ inputName: 'subcontrolIDs', objectIds: props.form.getValues('subcontrolIDs') || [] }] : []),
          ...(props.form.getValues('programIDs')?.length ? [{ inputName: 'programIDs', objectIds: props.form.getValues('programIDs') || [] }] : []),
          ...(props.form.getValues('procedureIDs')?.length ? [{ inputName: 'procedureIDs', objectIds: props.form.getValues('procedureIDs') || [] }] : []),
          ...(props.form.getValues('internalPolicyIDs')?.length ? [{ inputName: 'internalPolicyIDs', objectIds: props.form.getValues('internalPolicyIDs') || [] }] : []),
          ...(props.form.getValues('evidenceIDs')?.length ? [{ inputName: 'evidenceIDs', objectIds: props.form.getValues('evidenceIDs') || [] }] : []),
          ...(props.form.getValues('groupIDs')?.length ? [{ inputName: 'groupIDs', objectIds: props.form.getValues('groupIDs') || [] }] : []),
        ]
      : [],
  )

  useEffect(() => {
    props.onTaskObjectTypeChange(taskObjectTypes)
  }, [taskObjectTypes])

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const objectTypeId = row.original.id as string
        const name = row.original.name
        const inputName = row.original.inputName
        const isChecked = taskObjectTypes.some((item) => item.objectIds.includes(objectTypeId))

        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={objectTypeId}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setTaskObjectTypes((prevState) => {
                  const existingIndex = prevState.findIndex((item) => item.inputName === inputName)

                  if (checked) {
                    if (existingIndex !== -1) {
                      return prevState.map((item, idx) => (idx === existingIndex ? { ...item, objectIds: [...item.objectIds, objectTypeId] } : item))
                    }
                    return [...prevState, { inputName: inputName, objectIds: [objectTypeId] }]
                  } else {
                    return prevState
                      .map((item) => (item.inputName === inputName ? { ...item, objectIds: item.objectIds.filter((id) => id !== objectTypeId) } : item))
                      .filter((item) => item.objectIds.length > 0)
                  }
                })
              }}
            />
            <span>{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
  ]

  return <DataTable columns={columns} data={props.data} />
}

export default TaskObjectTypeTable
