'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { ProgramProgramStatus, ProgramWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import usePlateEditor from '../plate/usePlateEditor'
import { useGetAllProgramsPaginated } from '@/lib/graphql-hooks/programs'
import { getProgramsColumns } from './object-association-programs-columns'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

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

  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    page: 1,
    pageSize: 5,
    query: { first: 5 },
  })

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
        <DataTable columns={columns} data={programs || []} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} loading={isLoading || isFetching} />

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
