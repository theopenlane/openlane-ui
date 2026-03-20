'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { type TObjectAssociationMap } from './types/TObjectAssociationMap'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'
import { type TableRow } from './object-association-config'
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
  onRowClick?: (id: string) => void
}

const ObjectAssociationTable = ({ data, onIDsChange, initialData, refCodeInitialData, onPaginationChange, pagination, paginationMeta, isLoading, onRowClick }: Props) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({})
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<TObjectAssociationMap>({})

  useEffect(() => {
    if (initialData) setSelectedIdsMap(initialData)
    if (refCodeInitialData) setSelectedRefCodeMap(refCodeInitialData)
  }, [initialData, refCodeInitialData])

  useEffect(() => {
    onIDsChange(selectedIdsMap, selectedRefCodeMap)
  }, [selectedIdsMap, selectedRefCodeMap, onIDsChange])

  const showFramework = data.some((row) => 'referenceFramework' in row)

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
      size: showFramework ? 35 : 15,
      maxSize: showFramework ? 35 : 15,
      enableResizing: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 120,
      maxSize: 120,
      cell: ({ row }) => {
        const { name } = row.original
        return <span className="block truncate whitespace-nowrap">{name}</span>
      },
    },
    ...(showFramework
      ? [
          {
            accessorKey: 'referenceFramework',
            header: 'Framework',
            size: 100,
            maxSize: 100,
            cell: ({ row }: { row: { original: TableRow } }) => <span className="block truncate">{row.original.referenceFramework ?? '—'}</span>,
          } satisfies ColumnDef<TableRow>,
        ]
      : []),
  ]

  // Force new data reference when selection changes so the memoized DataTable body re-renders
  const tableData = useMemo(() => {
    void selectedIdsMap
    return [...data]
  }, [data, selectedIdsMap])

  return (
    <DataTable
      key={showFramework ? 'with-framework' : 'no-framework'}
      loading={isLoading}
      onPaginationChange={onPaginationChange}
      pagination={pagination}
      paginationMeta={paginationMeta}
      columns={columns}
      data={tableData}
      wrapperClass="max-h-96 overflow-auto"
      tableKey={TableKeyEnum.OBJECT_ASSOCIATION}
      onRowClick={onRowClick ? (row) => row.id && onRowClick(row.id) : undefined}
    />
  )
}

export default ObjectAssociationTable
