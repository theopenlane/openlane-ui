'use client'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { Loading } from '@/components/shared/loading/loading'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TrustCenterSettingTrustCenterThemeMode, TrustCenterWatermarkConfigFont } from '@repo/codegen/src/schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { PageHeading } from '@repo/ui/page-heading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { useContext, useEffect, useState } from 'react'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { BookUp, Eye } from 'lucide-react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import UrlInput from './url-input'

const BrandSettingsPage: React.FC = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const setting = trustCenter?.setting
  const [easyColor, setEasyColor] = useState(setting?.primaryColor ?? '#f0f0e0')
  const [foreground, setForeground] = useState(setting?.foregroundColor ?? '#f0f0e0')
  const [background, setBackground] = useState(setting?.backgroundColor ?? '#f0f0e0')
  const [secondaryForeground, setSecondaryForeground] = useState(setting?.secondaryForegroundColor ?? '#f0f0e0')
  const [secondaryBackground, setSecondaryBackground] = useState(setting?.secondaryBackgroundColor ?? '#f0f0e0')
  const [accent, setAccent] = useState(setting?.accentColor ?? '#f0f0e0')
  const [font, setFont] = useState(setting?.font ?? 'outfit')
  const { updateTrustCenterSetting } = useHandleUpdateSetting()
  const [logoPreview, setLogoPreview] = useState<string | null>(setting?.logoFile?.presignedURL || setting?.logoRemoteURL || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoLink, setLogoLink] = useState(setting?.logoRemoteURL ?? '')

  const [faviconPreview, setFaviconPreview] = useState<string | null>(setting?.faviconFile?.presignedURL || setting?.faviconRemoteURL || null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconLink, setFaviconLink] = useState(setting?.faviconRemoteURL ?? '')

  const [selectedThemeType, setSelectedThemeType] = useState<TrustCenterSettingTrustCenterThemeMode>(setting?.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)
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
  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Branding', href: '/trust-center/branding' }])
  }, [setCrumbs])

  useEffect(() => {
    if (setting) {
      setTitle(setting.title || '')
      setOverview(setting.overview || '')
    }
  }, [setting])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  if (!setting || !trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  const handleLogoUpload = (uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file) return
    setLogoFile(uploadedFile.file)
    setLogoPreview(URL.createObjectURL(uploadedFile.file))
  }

  const handleFaviconUpload = (uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file) return
    setFaviconFile(uploadedFile.file)
    setFaviconPreview(URL.createObjectURL(uploadedFile.file))
  }

  const normalizeUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url
    }
    return `https://${url}`
  }

  const handleSave = async () => {
    if (!setting?.id) {
      return
    }
    await updateTrustCenterSetting({
      id: setting?.id,
      input: {
        primaryColor: easyColor,
        foregroundColor: foreground,
        backgroundColor: background,
        secondaryForegroundColor: secondaryForeground,
        secondaryBackgroundColor: secondaryBackground,
        accentColor: accent,
        font,
        themeMode: selectedThemeType,
        title,
        overview,
        clearLogoRemoteURL: true,
        ...(logoLink ? { logoRemoteURL: logoLink } : null),
        clearLogoFile: true,
        clearFaviconRemoteURL: true,
        ...(faviconLink ? { faviconRemoteURL: faviconLink } : null),
        clearFaviconFile: true,
      },
      ...(logoFile ? { logoFile: logoFile } : null),
      ...(faviconFile ? { faviconFile: faviconFile } : null),
    })
  }

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[1200px] grid gap-6">
        <PageHeading heading="Branding" />
        <Button variant="primary" icon={<BookUp size={16} strokeWidth={2} />} iconPosition="left" onClick={handleSave}>
          Publish
        </Button>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Title and Overview</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">This is the description text for this section.</p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-base font-medium leading-6">Title</p>
                <Input
                  id="trust-center-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                  }}
                  placeholder="Enter title"
                  className="text-base"
                />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-base font-medium leading-6">Overview</p>
                <Textarea
                  id="trust-center-overview"
                  value={overview}
                  onChange={(e) => {
                    setOverview(e.target.value)
                  }}
                  placeholder="Enter overview"
                  rows={5}
                  className="text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Theme</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">This is the description text for this section.</p>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={TrustCenterSettingTrustCenterThemeMode.EASY}
                    checked={selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY}
                    onChange={() => setSelectedThemeType(TrustCenterSettingTrustCenterThemeMode.EASY)}
                    className="sr-only"
                  />
                  <div
                    className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY ? 'border-5 border-primary' : ''}`}
                  >
                    {selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                  </div>
                  <p>Easy</p>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={TrustCenterSettingTrustCenterThemeMode.ADVANCED}
                    checked={selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED}
                    onChange={() => setSelectedThemeType(TrustCenterSettingTrustCenterThemeMode.ADVANCED)}
                    className="sr-only"
                  />
                  <div
                    className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED ? 'border-5 border-primary' : ''}`}
                  >
                    {selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                  </div>
                  <p>Advanced</p>
                </label>
              </div>
              {selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY && (
                <div className="flex flex-col gap-3">
                  <div className="w-[200px]">
                    <ColorInput label="" value={easyColor} onChange={setEasyColor} />
                  </div>
                  <div>
                    <p className="text-sm text-text-informational">Put your primary brand color and we&apos;ll take care of the rest.</p>
                  </div>
                </div>
              )}
              {selectedThemeType === TrustCenterSettingTrustCenterThemeMode.ADVANCED && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Font family</Label>
                    <Select defaultValue={font} onValueChange={setFont}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TrustCenterWatermarkConfigFont).map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ColorInput label="Foreground color" value={foreground} onChange={setForeground} />
                  <ColorInput label="Background color" value={background} onChange={setBackground} />
                  <ColorInput label="Accent/brand color" value={accent} onChange={setAccent} />
                  <ColorInput label="Secondary Foreground color" value={secondaryForeground} onChange={setSecondaryForeground} />
                  <ColorInput label="Secondary Background color" value={secondaryBackground} onChange={setSecondaryBackground} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Brand</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">This is the description text for this section.</p>
              </div>
              <div className="flex flex-col">
                <p className="mb-2 font-medium">Logo</p>
                <div className="flex-col gap-7 border-b pb-8">
                  <div className="flex gap-7">
                    <div>
                      <Label className="mb-2 block text-sm">Preview</Label>
                      <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={normalizeUrl(logoPreview)!} alt="Logo preview" className="max-h-28 object-contain" />
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
                            <UrlInput className="w-full" value={logoLink} onChange={setLogoLink} />
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
                          {faviconPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={normalizeUrl(faviconPreview)!} alt="Favicon preview" className="max-h-28 object-contain" />
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
                              <UrlInput className="w-full" value={faviconLink} onChange={setFaviconLink} />
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
      </div>
    </div>
  )
}

export default BrandSettingsPage
