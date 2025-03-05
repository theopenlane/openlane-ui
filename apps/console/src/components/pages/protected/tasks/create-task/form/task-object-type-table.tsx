'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TFormDataResponse } from '@/components/pages/protected/tasks/create-task/form/types/TFormDataResponse'
import { TTaskObjectType } from '@/components/pages/protected/tasks/create-task/form/types/TTaskObjectType'

type TProps = {
  data: TFormDataResponse[]
  onTaskObjectTypeChange: (taskObjectTypes: TTaskObjectType[]) => void
}

const TaskObjectTypeTable: React.FC<TProps> = (props: TProps) => {
  const [taskObjectTypes, setTaskObjectTypes] = useState<TTaskObjectType[]>([])

  useEffect(() => {
    props.onTaskObjectTypeChange(taskObjectTypes)
  }, [taskObjectTypes])

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const objectAssociationId = row.original.id as string
        const name = row.original.name
        const inputName = row.original.inputName
        const isChecked = taskObjectTypes.some((item) => item.objectIds.includes(objectAssociationId))

        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={objectAssociationId}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setTaskObjectTypes((prevState) => {
                  const existingIndex = prevState.findIndex((item) => item.inputName === inputName)

                  if (checked) {
                    if (existingIndex !== -1) {
                      return prevState.map((item, idx) => (idx === existingIndex ? { ...item, objectIds: [...item.objectIds, objectAssociationId] } : item))
                    }
                    return [...prevState, { inputName: inputName, objectIds: [objectAssociationId] }]
                  } else {
                    return prevState
                      .map((item) => (item.inputName === inputName ? { ...item, objectIds: item.objectIds.filter((id) => id !== objectAssociationId) } : item))
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
