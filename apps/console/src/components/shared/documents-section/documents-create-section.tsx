'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { PlusCircle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { acceptedFileTypes, acceptedFileTypesShort, maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { TUploadedFile } from '@/components/shared/file-upload/types'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { formatDateSince } from '@/utils/date'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'

type ExistingFileRow = {
  id: string
  providedFileName: string
  providedFileSize?: number | null
  providedFileExtension: string
  categoryType?: string | null
  createdAt?: string | null
}

type DocumentsCreateSectionProps = {
  onFilesChange: (files: File[]) => void
  onFileIdsChange?: (fileIds: string[]) => void
}

const DocumentsCreateSection: React.FC<DocumentsCreateSectionProps> = ({ onFilesChange, onFileIdsChange }) => {
  const [allFiles, setAllFiles] = useState<TUploadedFile[]>([])
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.EXISTING_FILES, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    }),
  )

  const { data, isLoading, paginationMeta } = useGetFiles({ pagination })
  const [existingFiles, setExistingFiles] = useState<ExistingFileRow[]>([])

  useEffect(() => {
    if (!isLoading) {
      const tableData: ExistingFileRow[] =
        data?.files?.edges?.map((edge) => ({
          id: edge!.node!.id,
          providedFileName: edge!.node!.providedFileName,
          providedFileSize: edge!.node!.providedFileSize,
          providedFileExtension: edge!.node!.providedFileExtension,
          categoryType: edge!.node!.categoryType,
          createdAt: edge!.node!.createdAt,
        })) || []

      setExistingFiles(tableData)
    }
  }, [isLoading, data?.files?.edges])

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setAllFiles((prev) => {
      const updated = [uploadedFile, ...prev]
      onFilesChange(updated.filter((f) => f.type === 'file' && f.file).map((f) => f.file as File))
      return updated
    })
  }

  const handleAddExisting = (row: ExistingFileRow) => {
    const alreadyAdded = allFiles.some((f) => f.id === row.id)
    if (alreadyAdded) return

    const newFile: TUploadedFile = {
      name: row.providedFileName,
      size: row.providedFileSize ?? undefined,
      type: 'existingFile',
      id: row.id,
      category: row.categoryType,
      createdAt: formatDateSince(row.createdAt),
    }

    setAllFiles((prev) => {
      const updated = [newFile, ...prev]
      onFileIdsChange?.(updated.filter((f) => f.type === 'existingFile').map((f) => f.id as string))
      return updated
    })
  }

  const handleDelete = (file: TUploadedFile) => {
    setAllFiles((prev) => {
      const updated = prev.filter((f) => f.name !== file.name || f.type !== file.type)

      onFilesChange(updated.filter((f) => f.type === 'file' && f.file).map((f) => f.file as File))
      onFileIdsChange?.(updated.filter((f) => f.type === 'existingFile').map((f) => f.id as string))

      return updated
    })
  }

  const selectedFileIds = allFiles.filter((f) => f.type === 'existingFile').map((f) => f.id as string)

  const columns: ColumnDef<ExistingFileRow>[] = [
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
        const isAlreadyAdded = selectedFileIds.includes(column.id)
        return (
          <div className="flex items-center justify-between w-full">
            <span>{formatDateSince(column.createdAt)}</span>
            {!isAlreadyAdded && <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAddExisting(column)} />}
          </div>
        )
      },
    },
  ]

  return (
    <div className="mt-5">
      <p className="text-lg mb-3">Documents</p>
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload" className="bg-unset">
            Upload
          </TabsTrigger>
          <TabsTrigger value="existingFiles" className="bg-unset">
            Existing Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={maxFileSizeInMb} multipleFiles={true} />
        </TabsContent>
        <TabsContent value="existingFiles">
          <DataTable columns={columns} data={existingFiles} pagination={pagination} onPaginationChange={(p: TPagination) => setPagination(p)} paginationMeta={paginationMeta} tableKey={TableKeyEnum.EXISTING_FILES} />
        </TabsContent>

        {allFiles.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-6">
            {allFiles.map((file, index) => (
              <UploadedFileDetailsCard key={`${file.type}-${file.name}-${index}`} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(file)} />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  )
}

export { DocumentsCreateSection }
