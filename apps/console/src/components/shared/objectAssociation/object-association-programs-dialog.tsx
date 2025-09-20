'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { TPagination } from '@repo/ui/pagination-types'
import { ProgramProgramStatus, ProgramWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { useGetAllProgramsPaginated } from '@/lib/graphql-hooks/programs'
import { getProgramsColumns } from './object-association-programs-columns'

type ProgramSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialData?: TObjectAssociationMap
  initialRefCodes?: string[]
  onSave: (idsMap: TObjectAssociationMap, refCodesMap: string[], frameworks: string[]) => void
}

export const ProgramSelectionDialog: React.FC<ProgramSelectionDialogProps> = ({ open, onClose, initialData, initialRefCodes, onSave }: ProgramSelectionDialogProps) => {
  const [selectedIdsMap, setSelectedIdsMap] = useState<TObjectAssociationMap>({ programIDs: [] })
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<string[]>([])
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
      setSelectedIdsMap(initialData?.programIDs ? { programIDs: [...initialData.programIDs] } : { programIDs: [] })
      setSelectedRefCodeMap(initialRefCodes ? [...initialRefCodes] : [])
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

  const columns = useMemo(
    () =>
      getProgramsColumns({
        selectedIdsMap,
        selectedRefCodeMap,
        frameworks,
        setSelectedIdsMap,
        setSelectedRefCodeMap,
        setFrameworks,
        convertToReadOnly: convertToReadOnly!,
      }),
    [selectedIdsMap, selectedRefCodeMap, frameworks, convertToReadOnly],
  )

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
