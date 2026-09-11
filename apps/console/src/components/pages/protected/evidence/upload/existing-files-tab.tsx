import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { PlusCircle } from 'lucide-react'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { useGetEvidenceFiles } from '@/lib/graphql-hooks/evidence'
import { formatDateSince } from '@/utils/date'
import { type TUploadedFile } from './types/TUploadedFile'
import { type TEvidenceFilesColumn } from './types/TEvidenceFilesColumn'
import { getFileCategory, getFileDisplayName } from '@/components/shared/file-table/columns'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'

type TProps = {
  evidenceFiles: TUploadedFile[]
  form: CreateEvidenceFormMethods
  existingFile: (uploadedFile: TUploadedFile) => void
}

const ExistingFilesTab: React.FC<TProps> = (props: TProps) => {
  const [pagination, setPagination] = useOrgTablePagination(
    {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    },
    TableKeyEnum.EVIDENCE_EXISTING_FILES,
  )

  const { data, isLoading, paginationMeta } = useGetEvidenceFiles({ pagination })

  const [files, setFiles] = useState<TEvidenceFilesColumn[]>([])

  useEffect(() => {
    if (!isLoading) {
      const tableData: TEvidenceFilesColumn[] =
        data?.files?.edges?.map((edge) => ({
          id: edge?.node?.id ?? '',
          name: edge?.node?.name ?? '',
          providedFileName: edge?.node?.providedFileName ?? '',
          providedFileSize: edge?.node?.providedFileSize ?? 0,
          presignedURL: edge?.node?.presignedURL ?? '',
          providedFileExtension: edge?.node?.providedFileExtension ?? '',
          metadata: edge?.node?.metadata ?? null,
          createdAt: edge?.node?.createdAt ?? '',
        })) || []

      setFiles(tableData)
    }
  }, [isLoading, data?.files?.edges])

  const handleAdd = (data: TEvidenceFilesColumn) => {
    const fileAdded = props.evidenceFiles.some((item) => item.id === data.id)
    if (fileAdded) {
      return
    }

    const formFileIds = props.form.getValues('fileIDs')
    props.form.setValue('fileIDs', [...(formFileIds || []), data.id])

    const newFile: TUploadedFile = {
      name: getFileDisplayName(data),
      size: data.providedFileSize ?? undefined,
      type: 'existingFile',
      id: data.id,
      category: getFileCategory(data),
      createdAt: formatDateSince(data.createdAt),
    }
    props.existingFile(newFile)
  }

  const columns: ColumnDef<TEvidenceFilesColumn>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => getFileDisplayName(row.original),
    },
    {
      accessorKey: 'metadata',
      header: 'Category',
      cell: ({ row }) => getFileCategory(row.original) ?? '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const column = row.original
        return (
          <div className="flex items-center justify-between w-full">
            <span>{formatDateSince(column.createdAt)}</span>
            <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAdd(column)} />
          </div>
        )
      },
    },
  ]

  return (
    <TabsContent value="existingFiles">
      <DataTable columns={columns} data={files} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} tableKey={TableKeyEnum.EVIDENCE_EXISTING_FILES} />
    </TabsContent>
  )
}

export default ExistingFilesTab
