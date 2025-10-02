'use client'
import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { acceptedFileTypes, acceptedFileTypesShort } from './evidence-upload-config'
import { TUploadedFile } from './types/TUploadedFile'
type TProps = {
  uploadedFile: (uploadedFile: TUploadedFile) => void
  acceptedFileTypes?: string[]
  acceptedFileTypesShort?: string[]
}

const UploadTab: React.FC<TProps> = (props: TProps) => {
  return (
    <TabsContent value="upload">
      <FileUpload
        acceptedFileTypes={props.acceptedFileTypes ?? acceptedFileTypes}
        onFileUpload={props.uploadedFile}
        acceptedFileTypesShort={props.acceptedFileTypesShort ?? acceptedFileTypesShort}
        maxFileSizeInMb={100}
        multipleFiles={true}
      />
    </TabsContent>
  )
}

export default UploadTab
