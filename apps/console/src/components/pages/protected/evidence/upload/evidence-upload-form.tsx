'use client'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React, { useEffect, useState } from 'react'
import { FileUp, Trash2, File } from 'lucide-react'
import { Tooltip } from '@nextui-org/react'
import UploadTab from '@/components/pages/protected/evidence/upload/upload-tab'
import DirectLinkTab from '@/components/pages/protected/evidence/upload/direct-link-tab'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import ExistingFilesTab from '@/components/pages/protected/evidence/upload/existing-files-tab'

type TProps = {
  evidenceFiles: (uploadedFiles: TUploadedFilesProps[]) => void
  resetEvidenceFiles: boolean
  setResetEvidenceFiles: () => void
  form: UseFormReturn<CreateEvidenceFormData>
}

const EvidenceUploadForm: React.FC<TProps> = (props: TProps) => {
  const defaultTab = 'upload'
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFilesProps[]>([])

  useEffect(() => {
    props.evidenceFiles(evidenceFiles)
  }, [evidenceFiles.length])

  useEffect(() => {
    if (props.resetEvidenceFiles) {
      setEvidenceFiles([])
      props.setResetEvidenceFiles()
    }
  }, [props.resetEvidenceFiles])

  const handleDelete = (file: TUploadedFilesProps) => {
    setEvidenceFiles((prev) => {
      const evidenceFiles = prev.filter((evidenceFile) => evidenceFile.name !== file.name)

      if (file.type === 'link') {
        props.form.setValue('url', undefined)
      }

      if (file.type === 'existingFile') {
        const formFileIds = props.form.getValues('fileIDs')
        const fileId = prev.find((item) => item.id === file.id)?.id
        formFileIds &&
          props.form.setValue(
            'fileIDs',
            formFileIds.filter((file) => file !== fileId),
          )
      }

      return evidenceFiles
    })
  }

  const handleUploadedFile = (uploadedFile: TUploadedFilesProps) => {
    setEvidenceFiles((prev) => [uploadedFile, ...prev])
  }

  return (
    <Tabs variant="solid" defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="directLink">Direct Link</TabsTrigger>
        <TabsTrigger value="existingFiles">Existing Files</TabsTrigger>
      </TabsList>
      <UploadTab uploadedFile={handleUploadedFile} />
      <DirectLinkTab directLink={handleUploadedFile} evidenceFiles={evidenceFiles} form={props.form} />
      <ExistingFilesTab existingFile={handleUploadedFile} evidenceFiles={evidenceFiles} form={props.form} />

      {evidenceFiles.map((file, index) => (
        <div key={index} className="border rounded p-3 mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2">{file.type === 'file' ? <FileUp className="w-8 h-8" /> : <File />}</div>
            <div>
              <div className="font-semibold">{file.type === 'file' ? file.name : <div className="truncate max-w-sm">{file.url}</div>}</div>
              <div className="text-sm">{file.type === 'file' ? `Size: ${Math.round(file.size! / 1024)} KB` : 'Direct link'}</div>
            </div>
          </div>
          <Tooltip>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDelete(file)} />
          </Tooltip>
        </div>
      ))}
    </Tabs>
  )
}

export default EvidenceUploadForm
