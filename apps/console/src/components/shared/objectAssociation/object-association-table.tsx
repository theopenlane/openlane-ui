'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { TPagination, TPaginationMeta } from '@repo/ui/pagination-types'
import usePlateEditor from '../plate/usePlateEditor'

type Props = {
  data: TObjectAssociationColumn[]
  onIDsChange: (updatedMap: TObjectAssociationMap, refCodes?: Partial<Record<string, string[]>>) => void
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  pagination?: TPagination | null
  onPaginationChange?: (arg: TPagination) => void
  paginationMeta?: TPaginationMeta
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData, refCodeInitialData, onPaginationChange, pagination, paginationMeta }: Props) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({})
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<TObjectAssociationMap>({})
  const { convertToReadOnly } = usePlateEditor()
  useEffect(() => {
    if (initialData) {
      setSelectedIdsMap(initialData)
    }
    if (refCodeInitialData) {
      setSelectedRefCodeMap(refCodeInitialData)
    }
  }, [initialData, refCodeInitialData])

  useEffect(() => {
    onIDsChange(selectedIdsMap, selectedRefCodeMap)
  }, [selectedIdsMap, data, onIDsChange, selectedRefCodeMap])
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
            <span className="whitespace-nowrap">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="line-clamp-2 overflow-hidden">{convertToReadOnly(row.original.description || row.original.details, 0)}</span>,
    },
  ]

  return <DataTable onPaginationChange={onPaginationChange} pagination={pagination} paginationMeta={paginationMeta} columns={columns} data={data} wrapperClass="max-h-96 overflow-auto" />
}

export default ObjectAssociationTable
