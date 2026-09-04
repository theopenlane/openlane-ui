'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { DataTable } from '@repo/ui/data-table'
import { ProgramProgramStatus, type ProgramWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { useGetAllProgramsPaginated } from '@/lib/graphql-hooks/program'
import { getProgramsColumns } from './object-association-programs-columns'
import { type TLinkedProgram } from './types/object-association-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'

type TProgramSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialPrograms?: TLinkedProgram[]
  onSave: (programs: TLinkedProgram[]) => void
}

export const ProgramSelectionDialog: React.FC<TProgramSelectionDialogProps> = ({ open, onClose, initialPrograms, onSave }: TProgramSelectionDialogProps) => {
  const [selectedPrograms, setSelectedPrograms] = useState<TLinkedProgram[]>([])
  const { convertToReadOnly } = usePlateEditor()

  const [pagination, setPagination] = useOrgTablePagination(
    {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    },
    TableKeyEnum.OBJECT_ASSOCIATION_PROGRAMS,
  )

  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSelectedPrograms(initialPrograms ?? [])
    }
  }

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
        selectedPrograms,
        setSelectedPrograms,
        convertToReadOnly: convertToReadOnly ?? (() => null),
      }),
    [selectedPrograms, convertToReadOnly],
  )

  const handleSave = () => {
    onSave(selectedPrograms)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Programs</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={columns}
          data={programs || []}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          loading={isLoading || isFetching}
          tableKey={TableKeyEnum.OBJECT_ASSOCIATION_PROGRAMS}
        />

        <DialogFooter>
          <CancelButton onClick={onClose}></CancelButton>
          <SaveButton onClick={handleSave} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
