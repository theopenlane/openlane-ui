import FileUpload from '@/components/shared/file-upload/file-upload'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { Eye } from 'lucide-react'
import UrlInput from './url-input'
import { useState } from 'react'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'

type BrandLogoIconSectionProps = {
  logoPreview: string | null
  setLogoPreview: React.Dispatch<React.SetStateAction<string | null>>
  setLogoFile: React.Dispatch<React.SetStateAction<File | null>>
  logoLink: string
  setLogoLink: React.Dispatch<React.SetStateAction<string>>
  faviconPreview: string | null
  setFaviconPreview: React.Dispatch<React.SetStateAction<string | null>>
  setFaviconFile: React.Dispatch<React.SetStateAction<File | null>>
  faviconLink: string
  setFaviconLink: React.Dispatch<React.SetStateAction<string>>
}

export const BrandLogoIconSection = (props: BrandLogoIconSectionProps) => {
  enum LogoLinkInputTypeEnum {
    URL = 'url',
    FILE = 'file',
  }
  enum FavIconInputTypeEnum {
    URL = 'url',
    FILE = 'file',
  }

  const [showLogoLinkInputType, setShowLogoLinkInputType] = useState<LogoLinkInputTypeEnum>(LogoLinkInputTypeEnum.FILE)
  const [showFavIconInputType, setShowFavIconInputType] = useState<FavIconInputTypeEnum>(FavIconInputTypeEnum.FILE)

  const normalizeUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url
    }
    return `https://${url}`
  }

  const handleLogoUpload = (uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file) return
    props.setLogoFile(uploadedFile.file)
    props.setLogoPreview(URL.createObjectURL(uploadedFile.file))
  }

  const handleFaviconUpload = (uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file) return
    props.setFaviconFile(uploadedFile.file)
    props.setFaviconPreview(URL.createObjectURL(uploadedFile.file))
  }

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-6">Brand</p>
            <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
              Upload your logo and favicon to brand your Trust Center. These assets appear in the header, browser tab, and when sharing your Trust Center externally.
            </p>
          </div>
          <div className="flex flex-col">
            <p className="mb-2 font-medium">Logo</p>
            <div className="flex-col gap-7 border-b pb-8">
              <div className="flex gap-7">
                <div>
                  <Label className="mb-2 block text-sm">Preview</Label>
                  <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border">
                    {props.logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={normalizeUrl(props.logoPreview)!} alt="Logo preview" className="max-h-28 object-contain" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </div>
                </div>

                <div>
                  {showLogoLinkInputType === LogoLinkInputTypeEnum.FILE && (
                    <>
                      <div className="flex items-center gap-1 mb-2">
                        <Label className="block text-sm">Upload</Label>
                      </div>
                      <div className="w-[417px]">
                        <FileUpload
                          acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                          onFileUpload={handleLogoUpload}
                          acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
                          maxFileSizeInMb={5}
                          multipleFiles={false}
                        />
                      </div>
                    </>
                  )}

                  {showLogoLinkInputType === LogoLinkInputTypeEnum.URL && (
                    <div className="flex  flex-col gap-2 mt-6">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm">URL</Label>
                      </div>
                      <div className="flex gap-3 items-center mt-1">
                        <UrlInput className="w-full" value={props.logoLink} onChange={props.setLogoLink} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-6 mt-5">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="logoLinkInputType"
                    value={LogoLinkInputTypeEnum.FILE}
                    checked={showLogoLinkInputType === LogoLinkInputTypeEnum.FILE}
                    onChange={() => setShowLogoLinkInputType(LogoLinkInputTypeEnum.FILE)}
                    className="sr-only"
                  />
                  <div
                    className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${showLogoLinkInputType === LogoLinkInputTypeEnum.FILE ? 'border-5 border-primary' : ''}`}
                  >
                    {showLogoLinkInputType === LogoLinkInputTypeEnum.FILE && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                  </div>
                  <p>Upload File</p>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="logoLinkInputType"
                    value={LogoLinkInputTypeEnum.URL}
                    checked={showLogoLinkInputType === LogoLinkInputTypeEnum.URL}
                    onChange={() => setShowLogoLinkInputType(LogoLinkInputTypeEnum.URL)}
                    className="sr-only"
                  />
                  <div
                    className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${showLogoLinkInputType === LogoLinkInputTypeEnum.URL ? 'border-5 border-primary' : ''}`}
                  >
                    {showLogoLinkInputType === LogoLinkInputTypeEnum.URL && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                  </div>
                  <p>Enter URL</p>
                </label>
              </div>
            </div>
            <div className="flex flex-col mt-8">
              <p className="mb-2 font-medium">Favicon</p>
              <div className="flex-col gap-7">
                <div className="flex gap-7">
                  <div>
                    <Label className="mb-2 block text-sm">Preview</Label>
                    <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border">
                      {props.faviconPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={normalizeUrl(props.faviconPreview)!} alt="Favicon preview" className="max-h-28 object-contain" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </div>
                  </div>

                  <div>
                    {showFavIconInputType === FavIconInputTypeEnum.FILE && (
                      <>
                        <div className="flex items-center gap-1 mb-2">
                          <Label className="block text-sm">Upload</Label>
                        </div>
                        <div className="w-[417px]">
                          <FileUpload
                            acceptedFileTypes={['image/x-icon', 'image/png', 'image/jpeg', 'image/vnd.microsoft.icon']}
                            onFileUpload={handleFaviconUpload}
                            acceptedFileTypesShort={['ICO', 'PNG', 'JPG']}
                            maxFileSizeInMb={1}
                            multipleFiles={false}
                          />
                        </div>
                      </>
                    )}

                    {showFavIconInputType === FavIconInputTypeEnum.URL && (
                      <div className="flex flex-col gap-2 mt-6">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm">URL</Label>
                        </div>
                        <div className="flex gap-3 items-center mt-1">
                          <UrlInput className="w-full" value={props.faviconLink} onChange={props.setFaviconLink} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 mt-5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="favIconInputType"
                      value={FavIconInputTypeEnum.FILE}
                      checked={showFavIconInputType === FavIconInputTypeEnum.FILE}
                      onChange={() => setShowFavIconInputType(FavIconInputTypeEnum.FILE)}
                      className="sr-only"
                    />
                    <div
                      className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${showFavIconInputType === FavIconInputTypeEnum.FILE ? 'border-5 border-primary' : ''}`}
                    >
                      {showFavIconInputType === FavIconInputTypeEnum.FILE && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                    </div>
                    <p>Upload File</p>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="favIconInputType"
                      value={FavIconInputTypeEnum.URL}
                      checked={showFavIconInputType === FavIconInputTypeEnum.URL}
                      onChange={() => setShowFavIconInputType(FavIconInputTypeEnum.URL)}
                      className="sr-only"
                    />
                    <div
                      className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${showFavIconInputType === FavIconInputTypeEnum.URL ? 'border-5 border-primary' : ''}`}
                    >
                      {showFavIconInputType === FavIconInputTypeEnum.URL && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                    </div>
                    <p>Enter URL</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
