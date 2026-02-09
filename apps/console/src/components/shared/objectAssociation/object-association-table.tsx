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
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)

        const validRows = currentPageRows.filter((row): row is TableRow & { id: string; inputName: string } => !!row.id && !!row.inputName)

        const allSelected = validRows.length > 0 && validRows.every((row) => (selectedIdsMap[row.inputName] ?? []).includes(row.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(isChecked: boolean) => {
                setSelectedIdsMap((prev) => {
                  const updated = { ...prev }
                  validRows.forEach(({ id, inputName }) => {
                    const current = updated[inputName] ?? []
                    updated[inputName] = isChecked ? [...new Set([...current, id])] : current.filter((v) => v !== id)
                  })
                  return updated
                })

                setSelectedRefCodeMap((prev) => {
                  const updated = { ...prev }
                  validRows.forEach(({ refCode, inputName }) => {
                    if (!refCode) return
                    const current = updated[inputName] ?? []
                    updated[inputName] = isChecked ? [...new Set([...current, refCode])] : current.filter((v) => v !== refCode)
                  })
                  return updated
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const { id, refCode, inputName } = row.original
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
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={checked} onCheckedChange={toggleChecked} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
      enableResizing: false,
      meta: {
        className: 'max-w-[5%] w-[5%]',
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      meta: {
        className: 'max-w-[40%] w-[30%]',
      },
      cell: ({ row }) => {
        const { name } = row.original
        return <span className="block truncate whitespace-nowrap">{name}</span>
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 0,
      enableResizing: false,
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
