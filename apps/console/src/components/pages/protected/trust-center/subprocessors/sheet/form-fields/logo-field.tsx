'use client'

import React, { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Eye } from 'lucide-react'
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
    watch,
    formState: { errors },
  } = useFormContext()

  const [preview, setPreview] = useState<string | null>(null)
  const logoFile = watch('logoFile')

  useEffect(() => {
    if (logoFile instanceof File) {
      const objectUrl = URL.createObjectURL(logoFile)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [logoFile])

  const normalizeUrl = (url?: string | null) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
    return `https://${url}`
  }

  return (
    <div className="space-y-2">
      {isEditing ? (
        <div className="flex gap-7 pt-2">
          <div>
            <Label className="mb-2 block text-sm">Preview</Label>
            <div className="flex h-[110px] w-[110px] items-center justify-center rounded-md border border-muted bg-background overflow-hidden">
              {preview || existingLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeUrl(preview || existingLogo)} alt="Logo preview" className="max-h-24 object-contain p-2" />
              ) : (
                <Eye className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <Label className="mb-2 block text-sm">Upload Logo</Label>
            <FileUpload
              onFileUpload={onFileUpload}
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
              acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
              maxFileSizeInMb={5}
              multipleFiles={false}
            />
            {errors.logoFile && <p className="text-red-500 text-sm mt-1">{String(errors.logoFile.message)}</p>}
          </div>
        </div>
      ) : (
        <div>
          <Label>Logo</Label>
          <div className="mt-2">
            {existingLogo ? (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-background overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={normalizeUrl(existingLogo)} alt="Subprocessor Logo" className="h-full w-full object-contain p-1" />
              </div>
            ) : (
              <p className="text-base text-muted-foreground">—</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
