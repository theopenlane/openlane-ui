'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@repo/ui/table-types'
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

type TSelection = {
  ids: TObjectAssociationMap
  refCodes: TObjectAssociationMap
}

type TSelectableRow = TableRow & { isSelected: boolean }

const isSelectedRow = (row: TableRow, ids: TObjectAssociationMap): boolean => !!row.id && !!row.inputName && (ids[row.inputName] ?? []).includes(row.id)

const ObjectAssociationTable = ({ data, onIDsChange, initialData, refCodeInitialData, onPaginationChange, pagination, paginationMeta, isLoading, onRowClick }: Props) => {
  const [selection, setSelection] = useState<TSelection>(() => ({ ids: initialData ?? {}, refCodes: refCodeInitialData ?? {} }))
  const selectionRef = useRef(selection)

  useEffect(() => {
    if (!initialData && !refCodeInitialData) return
    const seeded = { ids: initialData ?? selectionRef.current.ids, refCodes: refCodeInitialData ?? selectionRef.current.refCodes }
    selectionRef.current = seeded
    setSelection(seeded)
  }, [initialData, refCodeInitialData])

  const applySelection = (computeNext: (previous: TSelection) => TSelection) => {
    const next = computeNext(selectionRef.current)
    selectionRef.current = next
    setSelection(next)
    onIDsChange(next.ids, next.refCodes)
  }

  const showFramework = data.some((row) => 'referenceFramework' in row)

  const columns: ColumnDef<TSelectableRow>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)

        const validRows = currentPageRows.filter((row): row is TSelectableRow & { id: string; inputName: string } => !!row.id && !!row.inputName)

        const allSelected = validRows.length > 0 && validRows.every((row) => row.isSelected)

        return (
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(isChecked: boolean) => {
                applySelection((previous) => {
                  const ids = { ...previous.ids }
                  validRows.forEach(({ id, inputName }) => {
                    const current = ids[inputName] ?? []
                    ids[inputName] = isChecked ? [...new Set([...current, id])] : current.filter((v) => v !== id)
                  })

                  const refCodes = { ...previous.refCodes }
                  validRows.forEach(({ refCode, inputName }) => {
                    if (!refCode) return
                    const current = refCodes[inputName] ?? []
                    refCodes[inputName] = isChecked ? [...new Set([...current, refCode])] : current.filter((v) => v !== refCode)
                  })

                  return { ids, refCodes }
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const { id, refCode, inputName, isSelected } = row.original
        if (!id || !inputName) return null

        const toggleChecked = (isChecked: boolean) => {
          applySelection((previous) => {
            const currentIds = previous.ids[inputName] ?? []
            const ids = {
              ...previous.ids,
              [inputName]: isChecked ? (currentIds.includes(id) ? currentIds : [...currentIds, id]) : currentIds.filter((v) => v !== id),
            }

            if (!refCode) return { ids, refCodes: previous.refCodes }

            const currentRefCodes = previous.refCodes[inputName] ?? []
            const refCodes = {
              ...previous.refCodes,
              [inputName]: isChecked ? (currentRefCodes.includes(refCode) ? currentRefCodes : [...currentRefCodes, refCode]) : currentRefCodes.filter((v) => v !== refCode),
            }

            return { ids, refCodes }
          })
        }

        return (
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={toggleChecked} />
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
            cell: ({ row }: { row: { original: TSelectableRow } }) => <span className="block truncate">{row.original.referenceFramework ?? '—'}</span>,
          } satisfies ColumnDef<TSelectableRow>,
        ]
      : []),
  ]

  const tableData = useMemo<TSelectableRow[]>(() => data.map((row) => ({ ...row, isSelected: isSelectedRow(row, selection.ids) })), [data, selection])

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
