'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectTypes } from './types/TObjectTypes'

type Props = {
  data: TObjectAssociationColumn[]
  onIDsChange: (objectIds: TObjectTypes[]) => void
  initialData?: Partial<Record<`${Lowercase<string>}IDs`, string[]>>
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData }: Props) => {
  const [objectIds, setObjectIds] = useState<TObjectTypes[]>([])

  // Initialize checkboxes based on initialData
  useEffect(() => {
    if (!initialData) return

    const preselected: TObjectTypes[] = Object.entries(initialData).map(([key, ids]) => ({
      inputName: key,
      objectIds: ids ?? [],
    }))

    setObjectIds(preselected)
  }, [initialData])

  console.log(objectIds)

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const objectAssociationId = row.original.id as string
        const name = row.original.name
        const inputName = row.original.inputName
        console.log('inputName', inputName)
        const isChecked = objectIds.some((item) => item.inputName === inputName && item.objectIds.includes(objectAssociationId))

        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={objectAssociationId}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setObjectIds((prevState) => {
                  const existingIndex = prevState.findIndex((item) => item.inputName === inputName)

                  if (checked) {
                    if (existingIndex !== -1) {
                      const existingItem = prevState[existingIndex]
                      if (!existingItem.objectIds.includes(objectAssociationId)) {
                        const updatedItem = {
                          ...existingItem,
                          objectIds: [...existingItem.objectIds, objectAssociationId],
                        }
                        return prevState.map((item, idx) => (idx === existingIndex ? updatedItem : item))
                      }
                      return prevState
                    }

                    return [...prevState, { inputName, objectIds: [objectAssociationId] }]
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
      cell: ({ row }) => {
        return <span className="line-clamp-2 overflow-hidden">{row.original.description}</span>
      },
    },
  ]

  return <DataTable columns={columns} data={data} pageSize={5} />
}

export default ObjectAssociationTable
