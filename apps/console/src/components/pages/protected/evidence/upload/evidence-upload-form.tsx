'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React, { useCallback, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { TableKeyEnum } from '@repo/ui/table-key'
import UploadTab from '@/components/pages/protected/evidence/upload/upload-tab'
import DirectLinkTab from '@/components/pages/protected/evidence/upload/direct-link-tab'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type TUploadedFile } from './types/TUploadedFile'
import { EVIDENCE_FILE_CATEGORY_WHERE } from './evidence-upload-config'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import ExistingFilesTable from '@/components/shared/file-upload/existing-files-table'
import { getExistingFileIds } from '@/components/shared/file-upload/file-selection'

type TProps = {
  form: CreateEvidenceFormMethods
}

const EvidenceUploadForm: React.FC<TProps> = ({ form }) => {
  const watchedFiles = useWatch({ control: form.control, name: 'evidenceFiles', defaultValue: [] })
  const evidenceFiles = useMemo(() => watchedFiles ?? [], [watchedFiles])
  const selectedFileIds = useMemo(() => getExistingFileIds(evidenceFiles), [evidenceFiles])

  const handleDelete = (index: number) => {
    const current = form.getValues('evidenceFiles') ?? []

    if (current[index]?.type === 'link') {
      form.setValue('url', undefined)
    }

    form.setValue(
      'evidenceFiles',
      current.filter((_, position) => position !== index),
    )
  }

  const handleAddFile = useCallback(
    (file: TUploadedFile) => {
      form.setValue('evidenceFiles', [file, ...(form.getValues('evidenceFiles') ?? [])])
    },
    [form],
  )

  return (
    <Tabs defaultValue="upload">
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
      <UploadTab uploadedFile={handleAddFile} />
      <DirectLinkTab directLink={handleAddFile} evidenceFiles={evidenceFiles} form={form} />
      <TabsContent value="existingFiles">
        <ExistingFilesTable tableKey={TableKeyEnum.EVIDENCE_EXISTING_FILES} selectedFileIds={selectedFileIds} onSelect={handleAddFile} where={EVIDENCE_FILE_CATEGORY_WHERE} />
      </TabsContent>

      <div className="mt-6 flex gap-6">
        {evidenceFiles.map((file, index) => (
          <UploadedFileDetailsCard key={`${file.type}-${file.id ?? file.name}-${index}`} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(index)} />
        ))}
      </div>
    </Tabs>
  )
}

export default EvidenceUploadForm
