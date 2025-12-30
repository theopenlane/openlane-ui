'use client'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { FileText, Repeat2 } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'

interface Props {
  isEditing: boolean
  onFileUpload: (file: TUploadedFile | null) => void
  uploadedFile?: File | null
}

export const FileField = ({ onFileUpload, uploadedFile }: Props) => {
  const {
    formState: { errors },
  } = useFormContext()

  const handleRemoveFile = () => {
    onFileUpload(null)
  }

  return (
    <div>
      <Label>Document file</Label>
      {uploadedFile ? (
        <>
          <Card className="w-full p-2 shadow-[0px_1px_2px_0px_#09151D0A]">
            <div className="flex gap-2 p-2 items-center justify-between">
              <div className="flex gap-5 p-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-md bg-border border border-muted flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm leading-5">{uploadedFile.name}</div>
                  <div className="text-xs font-normal leading-4 text-muted-foreground">Size: {Math.round(uploadedFile.size! / 1024)} KB</div>
                </div>
              </div>
              <Button icon={<Repeat2 />} iconPosition="left" onClick={handleRemoveFile} variant="secondary">
                Replace
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <FileUpload onFileUpload={onFileUpload} maxFileSizeInMb={10} acceptedFileTypes={['application/pdf']} acceptedFileTypesShort={['PDF']} multipleFiles={false} />
      )}

      {errors.file && <p className="text-red-500 text-sm mt-1">{String(errors.file.message)}</p>}
    </div>
  )
}
