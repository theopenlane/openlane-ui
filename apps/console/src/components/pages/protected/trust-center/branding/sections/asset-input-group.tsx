'use client'

import { useState } from 'react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Label } from '@repo/ui/label'
import UrlInput from '../../shared/url-input'
import { Eye, Trash2 } from 'lucide-react'
import { type TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { InputTypeEnum } from './branding-assets-section'
import { Callout } from '@/components/shared/callout/callout'
import { ImageCropDialog } from '@/components/shared/image-crop-dialog/image-crop-dialog'

interface FileConfigs {
  types: string[]
  shortTypes: string[]
  maxSize: number
  note?: string
}

const SKIP_CROP_TYPES = ['image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']

interface AssetInputGroupProps {
  label: string
  preview: string | null
  link: string
  setLink: (val: string) => void
  onUpload: (uploadedFile: TUploadedFile) => void
  inputType: InputTypeEnum
  setInputType: (type: InputTypeEnum) => void
  isReadOnly: boolean
  normalizeUrl: (url?: string | null) => string | null
  fileConfigs: FileConfigs
  isImageValidSize?: boolean | null
  enableCrop?: boolean
  aspect?: number
  hideUrlOption?: boolean
  helperText?: string
  onRemove?: () => void
}

export const AssetInputGroup = ({
  label,
  preview,
  link,
  setLink,
  onUpload,
  inputType,
  setInputType,
  isReadOnly,
  normalizeUrl,
  fileConfigs,
  isImageValidSize,
  enableCrop,
  aspect,
  hideUrlOption,
  helperText,
  onRemove,
}: AssetInputGroupProps) => {
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [pendingUpload, setPendingUpload] = useState<TUploadedFile | null>(null)

  const options = [
    { label: 'Upload File', value: InputTypeEnum.FILE },
    { label: 'Enter URL', value: InputTypeEnum.URL },
  ]

  const handleFileUpload = (uploadedFile: TUploadedFile) => {
    if (!enableCrop || !uploadedFile.file || SKIP_CROP_TYPES.includes(uploadedFile.file.type)) {
      onUpload(uploadedFile)
      return
    }

    if (uploadedFile.url) {
      setImageToCrop(uploadedFile.url)
      setPendingUpload(uploadedFile)
      setCropDialogOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    const croppedUpload: TUploadedFile = {
      name: croppedFile.name,
      size: croppedFile.size,
      url: URL.createObjectURL(croppedFile),
      type: 'file',
      file: croppedFile,
    }
    onUpload(croppedUpload)
    setPendingUpload(null)
    setImageToCrop(null)
  }

  const handleCropClose = () => {
    setCropDialogOpen(false)
    setPendingUpload(null)
    setImageToCrop(null)
  }

  const baseName = label.toLowerCase().replace(/\s+/g, '-')
  const outputFileName = pendingUpload?.file?.type === 'image/png' ? `${baseName}.png` : `${baseName}.jpg`

  return (
    <div className="flex flex-col">
      <p className="mb-1 font-medium">{label}</p>
      {helperText && <p className="mb-2 text-sm text-inverted-muted-foreground">{helperText}</p>}
      <div className="flex gap-7">
        <div>
          <Label className="mb-2 block text-sm">Preview</Label>
          <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border bg-muted/10">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={normalizeUrl(preview) ?? ''} alt={`${label} preview`} className="max-h-28 max-w-[130px] object-contain" />
            ) : (
              <Eye className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {onRemove && preview && !isReadOnly && (
            <button type="button" onClick={onRemove} className="mt-2 flex items-center gap-1 text-sm text-destructive hover:underline">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}

          {isImageValidSize === false && (
            <Callout className="w-[300px] mt-5" variant="warning" title="File size">
              <p className="text-sm">This favicon exceeds recommended dimensions and may not display correctly or at all in some browsers. Recommended size: 32x32 or 64x64.</p>
            </Callout>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex-1">
            {inputType === InputTypeEnum.FILE ? (
              <>
                <Label className="block text-sm mb-2">Upload</Label>
                <div className="w-full max-w-[417px]">
                  <FileUpload
                    acceptedFileTypes={fileConfigs.types}
                    onFileUpload={handleFileUpload}
                    acceptedFileTypesShort={fileConfigs.shortTypes}
                    maxFileSizeInMb={fileConfigs.maxSize}
                    multipleFiles={false}
                    note={fileConfigs.note}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-6">
                <Label className="text-sm">URL</Label>
                <UrlInput disabled={isReadOnly} className="w-full" value={link} onChange={setLink} />
              </div>
            )}

            {!hideUrlOption && (
              <div className="flex gap-6 mt-5">
                {options.map((option) => (
                  <label key={option.value} className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      disabled={isReadOnly}
                      name={`${label.toLowerCase()}Type`}
                      checked={inputType === option.value}
                      onChange={() => setInputType(option.value)}
                      className="sr-only"
                    />
                    <div className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${inputType === option.value ? 'border-primary' : 'border-input'}`}>
                      {inputType === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm">{option.label}</p>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {enableCrop && imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={handleCropClose}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          title={`Crop ${label}`}
          description="Adjust the crop area to remove whitespace and click Save"
          outputFileName={outputFileName}
          aspect={aspect}
        />
      )}
    </div>
  )
}
