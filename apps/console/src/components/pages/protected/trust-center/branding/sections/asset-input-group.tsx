import FileUpload from '@/components/shared/file-upload/file-upload'
import { Label } from '@repo/ui/label'
import UrlInput from '../url-input'
import { Eye } from 'lucide-react'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { InputTypeEnum } from '../branding-page'

export type AssetInputType = 'url' | 'file'

export interface AssetGroupConfig {
  preview: string | null
  link: string
  setLink: (val: string) => void
  onUpload: (uploadedFile: TUploadedFile) => void
  inputType: AssetInputType
  setInputType: (type: InputTypeEnum) => void
}

interface AssetInputGroupProps extends AssetGroupConfig {
  label: string
  isReadOnly: boolean
  normalizeUrl: (url?: string | null) => string | null
  fileConfigs: {
    types: string[]
    shortTypes: string[]
    maxSize: number
  }
}

export const AssetInputGroup = ({ label, preview, link, setLink, onUpload, inputType, setInputType, isReadOnly, normalizeUrl, fileConfigs }: AssetInputGroupProps) => {
  const options = [
    { label: 'Upload File', value: InputTypeEnum.FILE },
    { label: 'Enter URL', value: InputTypeEnum.URL },
  ]

  return (
    <div className="flex flex-col">
      <p className="mb-2 font-medium">{label}</p>
      <div className="flex gap-7">
        <div>
          <Label className="mb-2 block text-sm">Preview</Label>
          <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={normalizeUrl(preview)!} alt={`${label} preview`} className="max-h-28 object-contain" />
            ) : (
              <Eye className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex-1">
            {inputType === InputTypeEnum.FILE ? (
              <>
                <Label className="block text-sm mb-2">Upload</Label>
                <div className="w-full max-w-[417px]">
                  <FileUpload
                    acceptedFileTypes={fileConfigs.types}
                    onFileUpload={onUpload}
                    acceptedFileTypesShort={fileConfigs.shortTypes}
                    maxFileSizeInMb={fileConfigs.maxSize}
                    multipleFiles={false}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-6">
                <Label className="text-sm">URL</Label>
                <UrlInput disabled={isReadOnly} className="w-full" value={link} onChange={setLink} />
              </div>
            )}

            <div className="flex gap-6 mt-5">
              {options.map((option) => (
                <label key={option.value} className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                  <input type="radio" disabled={isReadOnly} name={`${label.toLowerCase()}Type`} checked={inputType === option.value} onChange={() => setInputType(option.value)} className="sr-only" />
                  <div className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${inputType === option.value ? 'border-primary' : ''}`}>
                    {inputType === option.value && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                  </div>
                  <p className="text-sm">{option.label}</p>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
