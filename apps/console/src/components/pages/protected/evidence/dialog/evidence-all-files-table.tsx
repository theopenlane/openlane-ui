'use client'

import React, { useMemo } from 'react'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type ColumnDef } from '@repo/ui/table-types'
import { type FileWhereInput } from '@repo/codegen/src/schema'
import { getFileActionsColumn } from '@/components/shared/file-table/file-actions-column'
import { getFileNameColumn } from '@/components/shared/file-table/columns'
import { FILES_PAGE_SIZE_OPTIONS, useFilesTableState, type TFileRow } from '@/components/shared/file-table/use-files-table-state'
import { RelatedControlsCell } from '@/components/shared/crud-base/columns/related-controls-cell'
import FilePreviewDialog from '@/components/shared/file-preview/file-preview-dialog'
import { EVIDENCE_FILE_CATEGORY } from '@/components/pages/protected/evidence/upload/evidence-upload-config'
import { formatDateSince } from '@/utils/date'

const EVIDENCE_FILES_WHERE: FileWhereInput = { or: [{ categoryName: EVIDENCE_FILE_CATEGORY }, { hasEvidence: true }] }

const EvidenceSatisfiesCell: React.FC<{ evidence: TFileRow['evidence'] }> = ({ evidence }) => {
  const controlEdges = useMemo(() => evidence?.flatMap((item) => item.controls.edges ?? []), [evidence])
  const subcontrolEdges = useMemo(() => evidence?.flatMap((item) => item.subcontrols.edges ?? []), [evidence])

  return <RelatedControlsCell controlEdges={controlEdges} subcontrolEdges={subcontrolEdges} />
}

const EvidenceAllFilesTable: React.FC = () => {
  const { searchTerm, search, rows, isFetching, pagination, setPagination, paginationMeta, previewFile, setPreviewFile } = useFilesTableState({
    tableKey: TableKeyEnum.EVIDENCE_ALL_FILES,
    where: EVIDENCE_FILES_WHERE,
    withEvidence: true,
  })

  const columns = useMemo<ColumnDef<TFileRow>[]>(
    () => [
      getFileNameColumn<TFileRow>({ header: 'Filename', size: 240 }),
      {
        id: 'satisfies',
        header: 'Satisfies',
        size: 280,
        cell: ({ row }) => <EvidenceSatisfiesCell evidence={row.original.evidence} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        size: 140,
        cell: ({ row }) => formatDateSince(row.original.createdAt),
      },
      getFileActionsColumn<TFileRow>({ onPreview: setPreviewFile }),
    ],
    [setPreviewFile],
  )

  return (
    <div className="flex flex-col gap-3">
      <Input
        icon={isFetching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        placeholder="Search files..."
        aria-label="Search evidence files"
        value={searchTerm}
        onChange={(e) => search(e.currentTarget.value)}
        variant="searchTable"
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        pageSizeOptions={FILES_PAGE_SIZE_OPTIONS}
        tableKey={TableKeyEnum.EVIDENCE_ALL_FILES}
        noResultsText="No evidence files found"
      />

      <FilePreviewDialog file={previewFile} open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)} />
    </div>
  )
}

export default EvidenceAllFilesTable
