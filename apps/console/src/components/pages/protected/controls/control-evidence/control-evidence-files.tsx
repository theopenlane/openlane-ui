import { useGetEvidenceWithFilesPaginated } from '@/lib/graphql-hooks/evidence.ts'
import { FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import React, { useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { fileColumns } from '@/components/pages/protected/controls/control-evidence-files/table/columns.tsx'
import { EVIDENCE_FILES_SORT_FIELDS } from '@/components/pages/protected/controls/control-evidence-files/table/table-config.ts'
import { ControlEvidenceUploadDialog } from '@/components/pages/protected/controls/control-evidence/control-evidence-upload-dialog.tsx'
import { Download, Eye, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'

type TControlEvidenceFiles = {
  controlEvidenceID: string
}

const ControlEvidenceFiles: React.FC<TControlEvidenceFiles> = ({ controlEvidenceID }) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orderBy, setOrderBy] = useState<FileOrder[]>([
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const { files, isLoading: fetching, isError, pageInfo, totalCount } = useGetEvidenceWithFilesPaginated({ evidenceId: controlEvidenceID, orderBy: orderBy, pagination: pagination })

  const getAction = () => {
    return [
      {
        accessorKey: 'id',
        header: 'Action',
        cell: ({ cell }: any) => (
          <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex gap-4">
            <p className="flex items-center gap-1 cursor-pointer">
              <Eye size={16} />
              View
            </p>
            <p className="flex items-center gap-1 cursor-pointer">
              <Download size={16} />
              Download
            </p>
            <p className="flex items-center gap-1 cursor-pointer">
              <Trash2 size={16} />
              Delete
            </p>
          </div>
        ),
        size: 40,
      },
    ]
  }

  const columns = [...fileColumns, ...getAction()]

  if (isError) {
    return <p className="text-red-500">Error loading evidence files</p>
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg">Provided files</p>
        <div className="flex items-center gap-2">
          <ControlEvidenceUploadDialog controlEvidenceID={controlEvidenceID} />
          <Button icon={<Download />} iconPosition="left">
            Download All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={EVIDENCE_FILES_SORT_FIELDS}
        onSortChange={setOrderBy}
        data={files}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: fetching }}
      />
    </div>
  )
}

export default ControlEvidenceFiles
