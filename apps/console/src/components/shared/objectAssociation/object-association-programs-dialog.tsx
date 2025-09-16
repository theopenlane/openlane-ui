'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { TPagination } from '@repo/ui/pagination-types'
import { Program, ProgramProgramStatus, ProgramWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { useGetAllProgramsPaginated } from '@/lib/graphql-hooks/programs'

type ProgramSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialData?: TObjectAssociationMap
  initialRefCodes?: TObjectAssociationMap
  onSave: (idsMap: TObjectAssociationMap, refCodesMap: TObjectAssociationMap, frameworks: string[]) => void
}

export const ProgramSelectionDialog: React.FC<ProgramSelectionDialogProps> = ({ open, onClose, initialData, initialRefCodes, onSave }: ProgramSelectionDialogProps) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({ controlIDs: [] })
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<TObjectAssociationMap>({ controlIDs: [] })
  const [frameworks, setFrameworks] = useState<string[]>([])
  const { convertToReadOnly } = usePlateEditor()

  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    page: 1,
    pageSize: 5,
    query: { first: 5 },
  })

  useEffect(() => {
    if (open) {
      setSelectedIdsMap(initialData?.controlIDs ? { controlIDs: [...initialData.controlIDs] } : { controlIDs: [] })
      setSelectedRefCodeMap(initialRefCodes?.controlIDs ? { controlIDs: [...initialRefCodes.controlIDs] } : { controlIDs: [] })
    }
  }, [open, initialData, initialRefCodes])
  const where: ProgramWhereInput = useMemo(() => {
    return {
      statusIn: [
        ProgramProgramStatus.ACTION_REQUIRED,
        ProgramProgramStatus.ARCHIVED,
        ProgramProgramStatus.COMPLETED,
        ProgramProgramStatus.IN_PROGRESS,
        ProgramProgramStatus.NOT_STARTED,
        ProgramProgramStatus.READY_FOR_AUDITOR,
      ],
    }
  }, [])

  const { programs, paginationMeta, isLoading, isFetching } = useGetAllProgramsPaginated({
    where,
    pagination,
  })

  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    const newIds = isChecked ? [...new Set([...(selectedIdsMap.controlIDs || []), id])] : selectedIdsMap.controlIDs?.filter((v) => v !== id)

    const newRefCodes = isChecked ? [...new Set([...(selectedRefCodeMap.controlIDs || []), refCode])] : selectedRefCodeMap.controlIDs?.filter((v) => v !== refCode)

    const newFrameworks = isChecked ? [...new Set([...frameworks, referenceFramework || ''])] : frameworks.filter((f) => f !== referenceFramework)

    setSelectedIdsMap({ controlIDs: newIds })
    setSelectedRefCodeMap({ controlIDs: newRefCodes })
    setFrameworks(newFrameworks)
  }

  const columns: ColumnDef<Program>[] = [
    {
      accessorKey: 'name',
      header: 'Control',
      cell: ({ row }) => {
        const { id, displayID } = row.original
        const checked = selectedIdsMap.controlIDs?.includes(id) ?? false

        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, displayID, val === true)} />
            <span>{displayID}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="line-clamp-3 text-justify">{convertToReadOnly(row.getValue('description') as string, 0)}</div>,
    },
  ]

  const handleSave = () => {
    onSave(selectedIdsMap, selectedRefCodeMap, frameworks)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Programs</DialogTitle>
        </DialogHeader>
        <DataTable columns={columns} data={programs || []} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} loading={isLoading || isFetching} />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
