'use client'

import React, { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Eye } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { normalizeUrl } from '@/utils/normalizeUrl'

interface Props {
  onFileUpload: (file: TUploadedFile) => void
}

export const LogoField = ({ onFileUpload }: Props) => {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext()

  const [preview, setPreview] = useState<string | null>(null)
  const logoFile = watch('logoFile')
  const uploadMode = watch('uploadMode') || 'file'

  useEffect(() => {
    if (uploadMode === 'file' && logoFile instanceof File) {
      const objectUrl = URL.createObjectURL(logoFile)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [logoFile, uploadMode])

  return (
    <div className="space-y-4">
      <RadioGroup defaultValue="file" value={uploadMode} onValueChange={(value) => setValue('uploadMode', value)} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="file" id="file" />
          <Label htmlFor="file" className="font-normal cursor-pointer">
            Upload File
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="url" />
          <Label htmlFor="url" className="font-normal cursor-pointer">
            Enter URL
          </Label>
        </div>
      </RadioGroup>

      <div className="flex gap-7 pt-2">
        {uploadMode === 'file' && (
          <div>
            <Label className="mb-2 block text-sm">Preview</Label>
            <div className="flex h-[110px] w-[110px] items-center justify-center rounded-md border border-muted bg-background overflow-hidden">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeUrl(preview)} alt="Logo preview" className="max-h-24 object-contain p-2" onError={() => setPreview(null)} />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Eye className="h-6 w-6" />
                  <span className="text-[10px]">No Image</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1">
          {uploadMode === 'file' ? (
            <>
              <Label className="mb-2 block text-sm">Upload Logo</Label>
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
            <>
              <Label className="mb-2 block text-sm">Logo URL</Label>
              <Input {...register('logoUrl')} placeholder="https://example.com/logo.png" className="w-full" />
              {errors.logoUrl && <p className="text-red-500 text-sm mt-1">{String(errors.logoUrl.message)}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
