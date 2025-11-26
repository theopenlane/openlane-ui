'use client'

import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { TPagination, TPaginationMeta } from '@repo/ui/pagination-types'
import usePlateEditor from '../plate/usePlateEditor'
import { TableRow } from './object-assoiation-config'
import { TableKeyEnum } from '@repo/ui/table-key'

type Props = {
  data: TableRow[]
  onIDsChange: (updatedMap: TObjectAssociationMap, refCodes: Partial<Record<string, string[]>>) => void
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  pagination?: TPagination | null
  onPaginationChange?: (arg: TPagination) => void
  paginationMeta?: TPaginationMeta
  isLoading?: boolean
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData, refCodeInitialData, onPaginationChange, pagination, paginationMeta, isLoading }: Props) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({})
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<TObjectAssociationMap>({})
  const { convertToReadOnly } = usePlateEditor()

  useEffect(() => {
    if (initialData) setSelectedIdsMap(initialData)
    if (refCodeInitialData) setSelectedRefCodeMap(refCodeInitialData)
  }, [initialData, refCodeInitialData])

  useEffect(() => {
    onIDsChange(selectedIdsMap, selectedRefCodeMap)
  }, [selectedIdsMap, selectedRefCodeMap, onIDsChange])

  const columns: ColumnDef<TableRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const { id, refCode, name, inputName } = row.original

        if (!id || !inputName) return null

        const checked = selectedIdsMap[inputName]?.includes(id) ?? false

        const toggleChecked = (isChecked: boolean) => {
          setSelectedIdsMap((prev) => {
            const current = prev[inputName] ?? []
            return {
              ...prev,
              [inputName]: isChecked ? (current.includes(id) ? current : [...current, id]) : current.filter((v) => v !== id),
            }
          })

          if (refCode) {
            setSelectedRefCodeMap((prev) => {
              const current = prev[inputName] ?? []
              return {
                ...prev,
                [inputName]: isChecked ? (current.includes(refCode) ? current : [...current, refCode]) : current.filter((v) => v !== refCode),
              }
            })
          }
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
      cell: ({ row }) => {
        const { description, details } = row.original
        return <span className="line-clamp-2 overflow-hidden">{convertToReadOnly(description || details || '')}</span>
      },
    },
  ]
  return (
    <DataTable
      loading={isLoading}
      onPaginationChange={onPaginationChange}
      pagination={pagination}
      paginationMeta={paginationMeta}
      columns={columns}
      data={data}
      wrapperClass="max-h-96 overflow-auto"
      tableKey={TableKeyEnum.OBJECT_ASSOCIATION}
    />
  )
}

export default ObjectAssociationTable
