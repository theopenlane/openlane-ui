'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'

type Props = {
  data: TObjectAssociationColumn[]
  onIDsChange: (updatedMap: TObjectAssociationMap, refCodes?: any) => void
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData, refCodeInitialData }: Props) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({})
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<TObjectAssociationMap>({})

  useEffect(() => {
    if (initialData) {
      setSelectedIdsMap(initialData)
    }
    if (refCodeInitialData) {
      setSelectedRefCodeMap(refCodeInitialData)
    }
  }, [initialData])

  useEffect(() => {
    onIDsChange(selectedIdsMap, selectedRefCodeMap)
  }, [selectedIdsMap, data])

  const columns: ColumnDef<TObjectAssociationColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const id = row.original.id!
        const refCode = row.original.refCode
        const name = row.original.name
        const inputName = row.original.inputName

        const checked = selectedIdsMap[inputName]?.includes(id) ?? false

        const toggleChecked = (isChecked: boolean) => {
          setSelectedRefCodeMap((prev) => {
            const currentList = prev[inputName] ?? []

            if (isChecked) {
              if (currentList.includes(refCode)) return prev
              return { ...prev, [inputName]: [...currentList, refCode] }
            } else {
              const updatedList = currentList.filter((i) => i !== refCode)
              return { ...prev, [inputName]: updatedList }
            }
          })
          setSelectedIdsMap((prev) => {
            const currentList = prev[inputName] ?? []

            if (isChecked) {
              if (currentList.includes(id)) return prev
              return { ...prev, [inputName]: [...currentList, id] }
            } else {
              const updatedList = currentList.filter((i) => i !== id)
              return { ...prev, [inputName]: updatedList }
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
      cell: ({ row }) => <span className="line-clamp-2 overflow-hidden">{row.original.description || row.original.details}</span>,
    },
  ]

  return <DataTable columns={columns} data={data} />
}

export default ObjectAssociationTable
