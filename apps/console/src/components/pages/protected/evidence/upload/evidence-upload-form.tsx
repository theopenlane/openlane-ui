import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React, { useEffect, useState } from 'react'
import { FileUp, Trash2 } from 'lucide-react'
import { Tooltip } from '@nextui-org/react'
import UploadTab from '@/components/pages/protected/evidence/upload/upload-tab'
import DirectLinkTab from '@/components/pages/protected/evidence/upload/direct-link-tab'

type TProps = {
  evidenceFiles: (uploadedFiles: TUploadedFilesProps[]) => void
}

const EvidenceUploadForm: React.FC<TProps> = (props: TProps) => {
  const defaultTab = 'upload'
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFilesProps[]>([])

  useEffect(() => {
    props.evidenceFiles(evidenceFiles)
  }, [evidenceFiles.length])

  const handleDelete = (fileName: string) => {
    setEvidenceFiles((prev) => {
      return prev.filter((file) => file.name !== fileName)
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
      <DirectLinkTab />

      <TabsContent value="existingFiles">Coming soon...</TabsContent>

      {evidenceFiles.map((file, index) => (
        <div key={index} className="border rounded p-3 mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <div className="font-semibold">{file.name}</div>
              <div className="text-sm">Size: {Math.round(file.size! / 1024)} KB</div>
            </div>
          </div>
          <Tooltip>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDelete(file.name)} />
          </Tooltip>
        </div>
      ))}
    </Tabs>
  )
}

export default EvidenceUploadForm
