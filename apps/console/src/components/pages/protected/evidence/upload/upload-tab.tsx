'use client'
import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
type TProps = {
  uploadedFile: (uploadedFile: TUploadedFile) => void
}

const UploadTab: React.FC<TProps> = (props: TProps) => {
  const acceptedFileTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'text/plain; charset=utf-8',
    'application/zip',
    'application/rtf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-vnd.oasis.opendocument.spreadsheet',
    'text/csv',
    'application/x-yaml',
    'application/x-yaml; charset=utf-8',
    'text/yaml',
    'application/json',
    'application/json; charset=utf-8',
  ]

  const acceptedFileTypesShort = ['PDF', 'DOC(X)', 'CSV', 'XLSX', 'TXT', 'PNG', 'JPG', 'ZIP', 'YAML']

  return (
    <TabsContent value="upload">
      <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={props.uploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={100} multipleFiles={true} />
    </TabsContent>
  )
}

export default UploadTab
