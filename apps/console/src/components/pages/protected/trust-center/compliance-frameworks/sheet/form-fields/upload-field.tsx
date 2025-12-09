'use client'

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Eye } from 'lucide-react'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

export const UploadField = ({ isEditing, initialUrl }: { isEditing: boolean; initialUrl?: string | null }) => {
  const { setValue } = useFormContext()

  const [preview, setPreview] = useState<string | null>(null)

  const normalizeUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url
    }
    return `https://${url}`
  }

  useEffect(() => {
    if (initialUrl) {
      setPreview(normalizeUrl(initialUrl))
    }
  }, [initialUrl])

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded?.file) return
    setValue('logoFile', uploaded.file)
    setPreview(URL.createObjectURL(uploaded.file))
  }

  return (
    <div>
      <Label className="mb-2 block text-sm">Logo</Label>
      <div className="flex gap-4">
        {/* Preview */}
        <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border mb-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Preview" src={preview} className="max-h-28 object-contain" />
          ) : (
            <Eye className="h-6 w-6" />
          )}
        </div>

        {isEditing && (
          <div className="w-[290px]">
            <FileUpload
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
              acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
              maxFileSizeInMb={5}
              multipleFiles={false}
              onFileUpload={handleUpload}
            />
          </div>
        )}
      </div>
    </div>
  )
}
