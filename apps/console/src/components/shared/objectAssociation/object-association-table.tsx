'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'

type Props = {
  data: TObjectAssociationColumn[]
  onIDsChange: (objectIds: TObjectAssociationMap) => void
  initialData?: TObjectAssociationMap
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData }: Props) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({})

  useEffect(() => {
    if (initialData) {
      setSelectedIdsMap(initialData)
    }
  }, [initialData])

  useEffect(() => {
    onIDsChange(selectedIdsMap)
  }, [selectedIdsMap, onIDsChange])

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const id = row.original.id!
        const name = row.original.name
        const inputName = row.original.inputName

        const checked = selectedIdsMap[inputName]?.includes(id) ?? false

        const toggleChecked = (isChecked: boolean) => {
          setSelectedIdsMap((prev) => {
            const currentList = prev[inputName] ?? []

            if (isChecked) {
              if (currentList.includes(id)) return prev
              return { ...prev, [inputName]: [...currentList, id] }
            } else {
              const updatedList = currentList.filter((i) => i !== id)
              const next = { ...prev, [inputName]: updatedList }
              return next
            }
          })
        }

        return (
          <div className="flex items-center gap-3">
            <Checkbox id={id} checked={checked} onCheckedChange={toggleChecked} />
            <span>{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="line-clamp-2 overflow-hidden">{row.original.description}</span>,
    },
  ]

  return <DataTable columns={columns} data={data} pageSize={5} />
}

export default ObjectAssociationTable
