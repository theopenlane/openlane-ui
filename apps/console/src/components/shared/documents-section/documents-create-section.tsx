'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { TableKeyEnum } from '@repo/ui/table-key'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { acceptedFileTypes, acceptedFileTypesShort, maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import { getExistingFileIds, getNewFiles } from '@/components/shared/file-upload/file-selection'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import ExistingFilesTable from '@/components/shared/file-upload/existing-files-table'

type DocumentsCreateSectionProps = {
  onFilesChange: (files: File[]) => void
  onFileIdsChange?: (fileIds: string[]) => void
}

const DocumentsCreateSection: React.FC<DocumentsCreateSectionProps> = ({ onFilesChange, onFileIdsChange }) => {
  const [allFiles, setAllFiles] = useState<TUploadedFile[]>([])
  const allFilesRef = useRef<TUploadedFile[]>([])

  const selectedFileIds = useMemo(() => getExistingFileIds(allFiles), [allFiles])

  const applyChange = useCallback(
    (update: (previous: TUploadedFile[]) => TUploadedFile[]) => {
      const updated = update(allFilesRef.current)
      allFilesRef.current = updated
      setAllFiles(updated)
      onFilesChange(getNewFiles(updated))
      onFileIdsChange?.(getExistingFileIds(updated))
    },
    [onFilesChange, onFileIdsChange],
  )

  const handleAddFile = useCallback((file: TUploadedFile) => applyChange((previous) => [file, ...previous]), [applyChange])

  const handleDelete = (index: number) => applyChange((previous) => previous.filter((_, position) => position !== index))

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
          <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleAddFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={maxFileSizeInMb} multipleFiles={true} />
        </TabsContent>
        <TabsContent value="existingFiles">
          <ExistingFilesTable tableKey={TableKeyEnum.EXISTING_FILES} selectedFileIds={selectedFileIds} onSelect={handleAddFile} />
        </TabsContent>

        {allFiles.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-6">
            {allFiles.map((file, index) => (
              <UploadedFileDetailsCard key={`${file.type}-${file.id ?? file.name}-${index}`} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(index)} />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  )
}

export { DocumentsCreateSection }
