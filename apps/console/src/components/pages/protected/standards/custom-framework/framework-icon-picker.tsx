'use client'

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { imageAcceptedFileTypes, imageAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

const MAX_LOGO_SIZE_MB = 2

const PREVIEW_SIZES = [
  { label: 'Catalog card', size: 76 },
  { label: 'Framework page', size: 40 },
] as const

type TFrameworkIconPickerProps = {
  shortName: string
  logoSrc: string | null
  onUpload: (uploaded: TUploadedFile) => void
  onRemove: () => void
}

export const FrameworkIconPicker: React.FC<TFrameworkIconPickerProps> = ({ shortName, logoSrc, onUpload, onRemove }) => {
  const [uploadKey, setUploadKey] = useState(0)

  const handleRemove = () => {
    onRemove()
    setUploadKey((key) => key + 1)
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex flex-col gap-3">
        <Label>Upload your own</Label>
        <p className="text-sm text-muted-foreground">Use your framework’s logo or seal. Without one, a badge is generated from the short name “{shortName || '…'}”.</p>
        <FileUpload
          key={uploadKey}
          acceptedFileTypes={imageAcceptedFileTypes}
          acceptedFileTypesShort={imageAcceptedFileTypesShort}
          maxFileSizeInMb={MAX_LOGO_SIZE_MB}
          multipleFiles={false}
          inputLabel="Upload framework icon"
          onFileUpload={(uploaded) => uploaded.file && onUpload(uploaded)}
        />
        {logoSrc && (
          <div>
            <Button type="button" variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" onClick={handleRemove}>
              Use generated badge instead
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <Label>Where it shows</Label>
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          {PREVIEW_SIZES.map(({ label, size }) => (
            <div key={label} className="flex items-center gap-3">
              <StandardsIconMapper shortName={shortName} logoSrc={logoSrc} isCustom width={size} height={size} />
              <div className="text-sm">
                <p>{label}</p>
                <p className="text-muted-foreground">{size} px</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
