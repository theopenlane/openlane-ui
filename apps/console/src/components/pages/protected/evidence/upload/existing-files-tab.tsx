import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { format } from 'date-fns'
import { PlusCircle } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { useGetEvidenceFiles } from '@/lib/graphql-hooks/evidence'

type TProps = {
  evidenceFiles: TUploadedFile[]
  form: UseFormReturn<CreateEvidenceFormData>
  existingFile: (uploadedFile: TUploadedFile) => void
}

const ExistingFilesTab: React.FC<TProps> = (props: TProps) => {
  const { data, isLoading } = useGetEvidenceFiles()
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
  }, [isLoading])

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
      createdAt: format(new Date(data.createdAt as string), 'd MMM, yyyy'),
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
      cell: ({ cell, row }) => {
        const column = row.original
        return (
          <div className="flex items-center justify-between w-full">
            <span>{format(new Date(cell.getValue() as string), 'd MMM, yyyy')}</span>
            <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAdd(column)} />
          </div>
        )
      },
    },
  ]

  return (
    <TabsContent value="existingFiles">
      <DataTable columns={columns} data={files} />
    </TabsContent>
  )
}

export default ExistingFilesTab
