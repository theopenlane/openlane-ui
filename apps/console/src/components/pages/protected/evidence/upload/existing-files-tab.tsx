import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { PlusCircle } from 'lucide-react'
import { CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { useGetEvidenceFiles } from '@/lib/graphql-hooks/evidence'
import { formatDateSince } from '@/utils/date'
import { TUploadedFile } from './types/TUploadedFile'
import { TEvidenceFilesColumn } from './types/TEvidenceFilesColumn'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'

type TProps = {
  evidenceFiles: TUploadedFile[]
  form: CreateEvidenceFormMethods
  existingFile: (uploadedFile: TUploadedFile) => void
}

const ExistingFilesTab: React.FC<TProps> = (props: TProps) => {
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.EVIDENCE_EXISTING_FILES, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    }),
  )

  const { data, isLoading, paginationMeta } = useGetEvidenceFiles({ pagination })

  const [files, setFiles] = useState<TEvidenceFilesColumn[]>([])

  useEffect(() => {
    if (!isLoading) {
      const tableData: TEvidenceFilesColumn[] =
        data?.files?.edges?.map((edge) => ({
          id: edge!.node!.id,
          providedFileName: edge!.node!.providedFileName,
          presignedURL: edge!.node!.presignedURL,
          providedFileExtension: edge!.node!.providedFileExtension,
          categoryType: edge!.node!.categoryType,
          createdAt: edge!.node!.createdAt,
        })) || []

      setFiles(tableData)
    }
  }, [isLoading, data?.files?.edges])

  const handleAdd = (data: TEvidenceFilesColumn) => {
    const fileAdded = props.evidenceFiles.some((item) => item.name === data.providedFileName)
    if (fileAdded) {
      return
    }

    const formFileIds = props.form.getValues('fileIDs')
    props.form.setValue('fileIDs', [...(formFileIds || []), data.id])

    const newFile: TUploadedFile = {
      name: data.providedFileName,
      type: 'existingFile',
      id: data.id,
      category: data.categoryType,
      createdAt: formatDateSince(data.createdAt),
    }
    props.existingFile(newFile)
  }

  const columns: ColumnDef<TEvidenceFilesColumn>[] = [
    {
      accessorKey: 'providedFileName',
      header: 'Filename',
    },
    {
      accessorKey: 'categoryType',
      header: 'Category',
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
      <DataTable
        columns={columns}
        data={files}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.EVIDENCE_EXISTING_FILES}
      />
    </TabsContent>
  )
}

export default ExistingFilesTab
