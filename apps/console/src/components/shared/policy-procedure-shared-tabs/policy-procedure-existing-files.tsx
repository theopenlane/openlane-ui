import { TEvidenceFilesColumn } from '@/components/pages/protected/evidence/upload/types/TEvidenceFilesColumn'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetEvidenceFiles } from '@/lib/graphql-hooks/evidence'
import { FileWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import React, { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateSince } from '@/utils/date'
import { PlusCircle } from 'lucide-react'
import { PolicyProcedureTabEnum } from '../enum-mapper/policy-procedure-tab-enum'
import { TabsContent } from '@repo/ui/tabs'
import { DataTable } from '@repo/ui/data-table'

type TPolicyProcedureExistingFilesProps = {
  onAddExistingFile: (uploadedFile: TUploadedFile) => void
}

const PolicyProcedureExistingFiles: React.FC<TPolicyProcedureExistingFilesProps> = ({ onAddExistingFile }: TPolicyProcedureExistingFilesProps) => {
  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    pageSize: 5,
    page: 1,
    query: { first: 5 },
  })

  const where: FileWhereInput = {
    providedFileExtensionIn: ['.docx', '.txt'],
  }

  const { data, isLoading, paginationMeta } = useGetEvidenceFiles({ where, pagination })

  const filesData: TEvidenceFilesColumn[] = useMemo(() => {
    return (
      data?.files?.edges?.map((edge) => ({
        id: edge!.node!.id,
        providedFileName: edge!.node!.providedFileName,
        presignedURL: edge!.node!.presignedURL,
        providedFileExtension: edge!.node!.providedFileExtension,
        categoryType: edge!.node!.categoryType,
        createdAt: edge!.node!.createdAt,
      })) || []
    )
  }, [data])

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
      cell: ({ cell, row }) => {
        const column = row.original
        return (
          <div className="flex items-center justify-between w-full">
            <span>{formatDateSince(cell.getValue() as string)}</span>
            <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAdd(column)} />
          </div>
        )
      },
    },
  ]
  const handleAdd = (data: TEvidenceFilesColumn) => {
    const newFile: TUploadedFile = {
      name: data.providedFileName,
      type: 'existingFile',
      id: data.id,
      category: data.categoryType,
      createdAt: formatDateSince(data.createdAt),
    }

    if (onAddExistingFile) {
      onAddExistingFile(newFile)
    }
  }
  return (
    <TabsContent value={PolicyProcedureTabEnum.ExistingFiles}>
      <DataTable
        columns={columns}
        data={filesData}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
      />
    </TabsContent>
  )
}

export default PolicyProcedureExistingFiles
