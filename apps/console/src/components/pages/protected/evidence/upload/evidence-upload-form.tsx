'use client'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React, { useEffect, useState } from 'react'
import UploadTab from '@/components/pages/protected/evidence/upload/upload-tab'
import DirectLinkTab from '@/components/pages/protected/evidence/upload/direct-link-tab'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import ExistingFilesTab from '@/components/pages/protected/evidence/upload/existing-files-tab'
import { TUploadedFile } from './types/TUploadedFile'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'

type TProps = {
  evidenceFiles: (uploadedFiles: TUploadedFile[]) => void
  resetEvidenceFiles: boolean
  setResetEvidenceFiles: () => void
  form: UseFormReturn<CreateEvidenceFormData>
}

const EvidenceUploadForm: React.FC<TProps> = (props: TProps) => {
  const defaultTab = 'upload'
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFile[]>([])

  useEffect(() => {
    props.evidenceFiles(evidenceFiles)
  }, [evidenceFiles.length, evidenceFiles, props])

  useEffect(() => {
    if (props.resetEvidenceFiles) {
      setEvidenceFiles([])
      props.setResetEvidenceFiles()
    }
  }, [props.resetEvidenceFiles, props])

  const handleDelete = (file: TUploadedFile) => {
    setEvidenceFiles((prev) => {
      const evidenceFiles = prev.filter((evidenceFile) => evidenceFile.name !== file.name)

      if (file.type === 'link') {
        props.form.setValue('url', undefined)
      }

      if (file.type === 'existingFile') {
        const formFileIds = props.form.getValues('fileIDs')
        const fileId = prev.find((item) => item.id === file.id)?.id
        if (formFileIds) {
          props.form.setValue(
            'fileIDs',
            formFileIds.filter((file) => file !== fileId),
          )
        }
      }

      return evidenceFiles
    })
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setEvidenceFiles((prev) => [uploadedFile, ...prev])
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="upload" className="bg-unset">
          Upload
        </TabsTrigger>
        <TabsTrigger value="directLink" className="bg-unset">
          Direct Link
        </TabsTrigger>
        <TabsTrigger value="existingFiles" className="bg-unset">
          Existing Files
        </TabsTrigger>
      </TabsList>
      <UploadTab uploadedFile={handleUploadedFile} />
      <DirectLinkTab directLink={handleUploadedFile} evidenceFiles={evidenceFiles} form={props.form} />
      <ExistingFilesTab existingFile={handleUploadedFile} evidenceFiles={evidenceFiles} form={props.form} />

      <div className="mt-6 flex gap-6">
        {evidenceFiles.map((file, index) => (
          <>
            <UploadedFileDetailsCard key={index} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(file)} />
          </>
        ))}
      </div>
    </Tabs>
  )
}

export default EvidenceUploadForm
