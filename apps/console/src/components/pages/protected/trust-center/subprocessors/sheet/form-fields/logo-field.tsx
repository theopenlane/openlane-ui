'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

interface Props {
  isEditing: boolean
  onFileUpload: (file: TUploadedFile) => void
  existingLogo?: string | null
}

export const LogoField = ({ isEditing, onFileUpload, existingLogo }: Props) => {
  const {
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Logo</Label>

      {isEditing ? (
        <>
          <FileUpload
            onFileUpload={onFileUpload}
            acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
            acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
            maxFileSizeInMb={5}
            multipleFiles={false}
          />
          {errors.logoFile && <p className="text-red-500 text-sm mt-1">{String(errors.logoFile.message)}</p>}
        </>
      ) : (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {existingLogo ? <img src={existingLogo} alt="Subprocessor Logo" className="w-16 h-16 object-contain rounded border p-1" /> : <p className="text-base text-muted-foreground">—</p>}
        </div>
      )}
    </div>
  )
}
