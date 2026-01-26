'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { ProgramProgramStatus, ProgramWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { useGetAllProgramsPaginated } from '@/lib/graphql-hooks/programs'
import { getProgramsColumns } from './object-association-programs-columns'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'

type TProgramSelectionDialogProps = {
  open: boolean
  onClose: () => void
  initialRefCodes?: string[]
  onSave: (newIds: string[], refCodesMap: string[], description?: string[]) => void
  form: UseFormReturn<CreateEvidenceFormData>
}

export const ProgramSelectionDialog: React.FC<TProgramSelectionDialogProps> = ({ open, onClose, initialRefCodes, onSave, form }: TProgramSelectionDialogProps) => {
  const [selectedRefCodeMap, setSelectedRefCodeMap] = useState<string[]>([])
  const [frameworks, setFrameworks] = useState<string[]>([])
  const { convertToReadOnly } = usePlateEditor()

  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.OBJECT_ASSOCIATION_PROGRAMS, {
      ...DEFAULT_PAGINATION,
      page: 1,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  useEffect(() => {
    if (open) {
      setSelectedRefCodeMap(initialRefCodes ? [...initialRefCodes] : [])
    }
  }, [open, initialRefCodes])

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
        selectedRefCodeMap,
        frameworks,
        setSelectedRefCodeMap,
        setFrameworks,
        convertToReadOnly: convertToReadOnly!,
        form,
      }),
    [selectedRefCodeMap, frameworks, convertToReadOnly, form],
  )

  const handleSave = () => {
    onSave(form.getValues('programIDs') || [], selectedRefCodeMap, frameworks)
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
