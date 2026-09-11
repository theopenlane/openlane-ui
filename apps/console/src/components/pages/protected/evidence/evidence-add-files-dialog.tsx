'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type FileWhereInput } from '@repo/codegen/src/schema'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { useNotification } from '@/hooks/useNotification'
import { acceptedFileTypes, acceptedFileTypesShort, EVIDENCE_FILE_CATEGORY_WHERE } from '@/components/pages/protected/evidence/upload/evidence-upload-config'
import { useUploadEvidenceFiles } from '@/lib/graphql-hooks/evidence'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import ExistingFilesTable from '@/components/shared/file-upload/existing-files-table'
import { getExistingFileIds, getNewFiles } from '@/components/shared/file-upload/file-selection'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TEvidenceAddFilesDialog = {
  evidenceID: string
}

const EvidenceAddFilesDialog: React.FC<TEvidenceAddFilesDialog> = ({ evidenceID }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateEvidence, isPending: isSubmitting } = useUploadEvidenceFiles()
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFile[]>([])

  const unlinkedEvidenceFilesWhere = useMemo<FileWhereInput>(() => ({ ...EVIDENCE_FILE_CATEGORY_WHERE, not: { hasEvidenceWith: [{ id: evidenceID }] } }), [evidenceID])
  const existingFileIds = useMemo(() => getExistingFileIds(evidenceFiles), [evidenceFiles])

  const handleSubmit = async () => {
    try {
      await updateEvidence({
        updateEvidenceId: evidenceID,
        input: { addFileIDs: existingFileIds },
        evidenceFiles: getNewFiles(evidenceFiles),
      })
      setIsOpen(false)
      successNotification({
        title: 'Evidence files added',
        description: `Evidence file(s) have been successfully added`,
      })
      setEvidenceFiles([])
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleAddFile = useCallback((file: TUploadedFile) => {
    setEvidenceFiles((prev) => [file, ...prev])
  }, [])

  const handleDelete = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, position) => position !== index))
  }

  const handleCancel = () => {
    setIsOpen(false)
    setEvidenceFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Upload />} iconPosition="left" disabled={isSubmitting} loading={isSubmitting}>
          Add Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Evidence Files</DialogTitle>
        </DialogHeader>
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
            <ExistingFilesTable tableKey={TableKeyEnum.EVIDENCE_LINK_EXISTING_FILES} selectedFileIds={existingFileIds} onSelect={handleAddFile} where={unlinkedEvidenceFilesWhere} />
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-6">
          {evidenceFiles.map((file, index) => (
            <UploadedFileDetailsCard key={`${file.type}-${file.id ?? file.name}-${index}`} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(index)} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting || evidenceFiles.length === 0}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
          <CancelButton disabled={isSubmitting} onClick={handleCancel}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { EvidenceAddFilesDialog }
