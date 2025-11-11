'use client'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

interface Props {
  isEditing: boolean
  onFileUpload: (file: TUploadedFile) => void
}

export const FileField = ({ onFileUpload }: Props) => {
  const {
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Document file</Label>
      <FileUpload onFileUpload={onFileUpload} maxFileSizeInMb={10} acceptedFileTypes={['application/pdf']} acceptedFileTypesShort={['PDF']} multipleFiles={false} />
      {errors.file && <p className="text-red-500 text-sm mt-1">{String(errors.file.message)}</p>}
    </div>
  )
}
