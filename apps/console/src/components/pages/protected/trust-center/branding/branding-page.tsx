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
import { useContext, useEffect, useMemo, useState } from 'react'
import { UpdateTrustCenterSettingsArgs, useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { BookUp, Eye, RotateCcw } from 'lucide-react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import UrlInput from '../shared/url-input'
import { TrustCenterWatermarkConfigFontMapper, TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import SectionWarning from './section-warning'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

const BrandPage: React.FC = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const cnameRecord = trustCenter?.previewDomain?.cnameRecord
  const setting = trustCenter?.setting
  const previewSetting = trustCenter?.previewSetting

  const [activeTab, setActiveTab] = useState<'preview' | 'published'>('preview')

  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [easyColor, setEasyColor] = useState('#f0f0e0')
  const [foreground, setForeground] = useState('#f0f0e0')
  const [background, setBackground] = useState('#f0f0e0')
  const [secondaryForeground, setSecondaryForeground] = useState('#f0f0e0')
  const [secondaryBackground, setSecondaryBackground] = useState('#f0f0e0')
  const [accent, setAccent] = useState('#f0f0e0')
  const [font, setFont] = useState('outfit')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoLink, setLogoLink] = useState('')
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconLink, setFaviconLink] = useState('')
  const [selectedThemeType, setSelectedThemeType] = useState<TrustCenterSettingTrustCenterThemeMode>(TrustCenterSettingTrustCenterThemeMode.EASY)

  const { updateTrustCenterSetting } = useHandleUpdateSetting()
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)

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

  const initialValues = useMemo(
    () => ({
      title: (activeTab === 'preview' ? previewSetting?.title : setting?.title) ?? '',
      overview: (activeTab === 'preview' ? previewSetting?.overview : setting?.overview) ?? '',
      primaryColor: (activeTab === 'preview' ? previewSetting?.primaryColor : setting?.primaryColor) ?? '#f0f0e0',
      foregroundColor: (activeTab === 'preview' ? previewSetting?.foregroundColor : setting?.foregroundColor) ?? '#f0f0e0',
      backgroundColor: (activeTab === 'preview' ? previewSetting?.backgroundColor : setting?.backgroundColor) ?? '#f0f0e0',
      secondaryForegroundColor: (activeTab === 'preview' ? previewSetting?.secondaryForegroundColor : setting?.secondaryForegroundColor) ?? '#f0f0e0',
      secondaryBackgroundColor: (activeTab === 'preview' ? previewSetting?.secondaryBackgroundColor : setting?.secondaryBackgroundColor) ?? '#f0f0e0',
      accentColor: (activeTab === 'preview' ? previewSetting?.accentColor : setting?.accentColor) ?? '#f0f0e0',
      font: (activeTab === 'preview' ? previewSetting?.font : setting?.font) ?? 'outfit',
      themeMode: (activeTab === 'preview' ? previewSetting?.themeMode : setting?.themeMode) ?? TrustCenterSettingTrustCenterThemeMode.EASY,
      logoRemoteURL: (activeTab === 'preview' ? previewSetting?.logoRemoteURL : setting?.logoRemoteURL) ?? '',
      faviconRemoteURL: (activeTab === 'preview' ? previewSetting?.faviconRemoteURL : setting?.faviconRemoteURL) ?? '',
      logoFileId: activeTab === 'preview' ? previewSetting?.logoFile?.id : setting?.logoFile?.id,
      faviconFileId: activeTab === 'preview' ? previewSetting?.faviconFile?.id : setting?.faviconFile?.id,
    }),
    [setting, previewSetting, activeTab],
  )

  const hasTextChanged = useMemo(() => {
    return title !== initialValues.title || overview !== initialValues.overview
  }, [title, overview, initialValues])

  const hasThemeChanged = useMemo(() => {
    const colorChanges =
      selectedThemeType === TrustCenterSettingTrustCenterThemeMode.EASY
        ? easyColor !== initialValues.primaryColor
        : foreground !== initialValues.foregroundColor ||
          background !== initialValues.backgroundColor ||
          accent !== initialValues.accentColor ||
          secondaryForeground !== initialValues.secondaryForegroundColor ||
          secondaryBackground !== initialValues.secondaryBackgroundColor

    return font !== initialValues.font || selectedThemeType !== initialValues.themeMode || colorChanges
  }, [font, selectedThemeType, easyColor, foreground, background, accent, secondaryForeground, secondaryBackground, initialValues])

  const hasAssetsChanged = useMemo(() => {
    return logoFile !== null || faviconFile !== null || logoLink !== initialValues.logoRemoteURL || faviconLink !== initialValues.faviconRemoteURL
  }, [logoFile, faviconFile, logoLink, faviconLink, initialValues])

  const isDirty = useMemo(() => hasTextChanged || hasThemeChanged || hasAssetsChanged, [hasTextChanged, hasThemeChanged, hasAssetsChanged])

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const hasPreviewDifference = useMemo(() => {
    if (!setting || !previewSetting) return null

    const textDiff = setting.title !== previewSetting.title || setting.overview !== previewSetting.overview

    const themeDiff =
      setting.themeMode !== previewSetting.themeMode ||
      setting.font !== previewSetting.font ||
      setting.primaryColor !== previewSetting.primaryColor ||
      setting.foregroundColor !== previewSetting.foregroundColor ||
      setting.backgroundColor !== previewSetting.backgroundColor ||
      setting.accentColor !== previewSetting.accentColor ||
      setting.secondaryForegroundColor !== previewSetting.secondaryForegroundColor ||
      setting.secondaryBackgroundColor !== previewSetting.secondaryBackgroundColor

    const assetDiff =
      setting.logoRemoteURL !== previewSetting.logoRemoteURL ||
      setting.faviconRemoteURL !== previewSetting.faviconRemoteURL ||
      setting.logoFile?.id !== previewSetting.logoFile?.id ||
      setting.faviconFile?.id !== previewSetting.faviconFile?.id

    const hasAnyDifference = textDiff || themeDiff || assetDiff

    return {
      text: textDiff,
      theme: themeDiff,
      assets: assetDiff,
      any: hasAnyDifference,
    }
  }, [setting, previewSetting])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Branding', href: '/trust-center/branding' }])
  }, [setCrumbs])

  useEffect(() => {
    setTitle(initialValues.title)
    setOverview(initialValues.overview)
    setEasyColor(initialValues.primaryColor)
    setForeground(initialValues.foregroundColor)
    setBackground(initialValues.backgroundColor)
    setSecondaryForeground(initialValues.secondaryForegroundColor)
    setSecondaryBackground(initialValues.secondaryBackgroundColor)
    setAccent(initialValues.accentColor)
    setFont(initialValues.font)
    setSelectedThemeType(initialValues.themeMode)
    setLogoPreview(activeTab === 'preview' ? previewSetting?.logoFile?.presignedURL || previewSetting?.logoRemoteURL || null : setting?.logoFile?.presignedURL || setting?.logoRemoteURL || null)
    setLogoLink(initialValues.logoRemoteURL)
    setFaviconPreview(
      activeTab === 'preview' ? previewSetting?.faviconFile?.presignedURL || previewSetting?.faviconRemoteURL || null : setting?.faviconFile?.presignedURL || setting?.faviconRemoteURL || null,
    )
    setFaviconLink(initialValues.faviconRemoteURL)
    setLogoFile(null)
    setFaviconFile(null)
  }, [initialValues, activeTab, setting, previewSetting])

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

  const colorInput = (value: string | null | undefined, colorKey: string, clearKey: string) => (value ? { [colorKey]: value } : { [clearKey]: true })

  const handleSave = async (action: 'preview' | 'publish') => {
    if (!setting?.id) return
    if (action === 'preview' && !previewSetting?.id) return

    const payload: UpdateTrustCenterSettingsArgs = {
      id: action === 'preview' ? previewSetting?.id : setting?.id,
      input: {
        ...colorInput(easyColor, 'primaryColor', 'clearPrimaryColor'),
        ...colorInput(foreground, 'foregroundColor', 'clearForegroundColor'),
        ...colorInput(background, 'backgroundColor', 'clearBackgroundColor'),
        ...colorInput(secondaryForeground, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...colorInput(secondaryBackground, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...colorInput(accent, 'accentColor', 'clearAccentColor'),
        font,
        themeMode: selectedThemeType,
        title,
        overview,
        ...(logoLink ? { logoRemoteURL: logoLink, clearLogoFile: true } : null),
        ...(logoFile ? { clearLogoRemoteURL: true } : null),
        ...(faviconLink ? { faviconRemoteURL: faviconLink, clearFaviconFile: true } : null),
        ...(faviconFile ? { clearFaviconRemoteURL: true } : null),
      },
      ...(logoFile ? { logoFile: logoFile } : null),
      ...(faviconFile ? { faviconFile: faviconFile } : null),
    }

    const resp = await updateTrustCenterSetting(payload)

    if (action === 'publish' && previewSetting?.id) {
      await updateTrustCenterSetting({
        id: previewSetting.id,
        input: {
          ...colorInput(easyColor, 'primaryColor', 'clearPrimaryColor'),
          ...colorInput(foreground, 'foregroundColor', 'clearForegroundColor'),
          ...colorInput(background, 'backgroundColor', 'clearBackgroundColor'),
          ...colorInput(secondaryForeground, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
          ...colorInput(secondaryBackground, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
          ...colorInput(accent, 'accentColor', 'clearAccentColor'),
          font,
          themeMode: selectedThemeType,
          title,
          overview,
          logoFileID: resp?.trustCenterSetting.logoFile?.id,
          logoRemoteURL: resp?.trustCenterSetting.logoRemoteURL,
          faviconFileID: resp?.trustCenterSetting.faviconFile?.id,
          faviconRemoteURL: resp?.trustCenterSetting.faviconRemoteURL,
        },
      })
    }
  }

  const handleRevert = () => {
    if (!previewSetting?.id) {
      return
    }
    const payload: UpdateTrustCenterSettingsArgs = {
      id: previewSetting.id,
      input: {
        ...colorInput(setting?.primaryColor, 'primaryColor', 'clearPrimaryColor'),
        ...colorInput(setting?.foregroundColor, 'foregroundColor', 'clearForegroundColor'),
        ...colorInput(setting?.backgroundColor, 'backgroundColor', 'clearBackgroundColor'),
        ...colorInput(setting?.secondaryForegroundColor, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...colorInput(setting?.secondaryBackgroundColor, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...colorInput(setting?.accentColor, 'accentColor', 'clearAccentColor'),
        font: setting?.font,
        themeMode: setting?.themeMode,
        title: setting?.title,
        overview: setting?.overview,
        logoRemoteURL: setting?.logoRemoteURL,
        faviconRemoteURL: setting?.faviconRemoteURL,
        logoFileID: setting?.logoFile?.id,
        faviconFileID: setting?.logoFile?.id,
      },
    }
    updateTrustCenterSetting(payload)
  }

  const onCancelNavigation = () => {
    navGuard.reject()
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  if (!setting) {
    return <div className="p-6">No trust center settings found.</div>
  }

  const isReadOnly = activeTab === 'published'

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[1200px] grid gap-6">
        <PageHeading heading="Branding" />
        <div className="flex items-center gap-5 w-full">
          <Button onClick={() => handleSave('preview')} type="button" variant="secondary" icon={<Eye size={16} strokeWidth={2} />} iconPosition="left">
            Preview
          </Button>
          {hasPreviewDifference?.any && (
            <Button onClick={handleRevert} type="button" variant="secondary" icon={<RotateCcw size={16} strokeWidth={2} />} iconPosition="left">
              Revert Changes
            </Button>
          )}
          <div className="flex items-center gap-10 flex-1">
            <UrlInput disabled hasCopyButton placeholder={cnameRecord ?? 'Preview URL not available yet'} value={cnameRecord ?? ''} className="h-8" />
            <Button className=" ml-auto" variant="primary" icon={<BookUp size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setIsConfirmationDialogOpen(true)}>
              Publish
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'published')} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent>
            {hasPreviewDifference && hasPreviewDifference.text && <SectionWarning />}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Title and Overview</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
                  This information appears prominently at the top of your Trust Center and is also used for SEO metadata, including the page title and description.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-base font-medium leading-6">Title</p>
                <Input
                  id="trust-center-title"
                  value={title}
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
            {hasPreviewDifference && hasPreviewDifference.theme && <SectionWarning />}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium leading-6">Theme</p>
                <p className="text-sm text-inverted-muted-foreground font-medium leading-6">
                  Control the visual appearance of your Trust Center. Choose Easy Mode to apply your brand color automatically, or use Advanced Mode to customize fonts, colors, and other design
                  settings.
                </p>
              </div>
              <div className="flex gap-6">
                <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="theme"
                    disabled={isReadOnly}
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
                <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="theme"
                    disabled={isReadOnly}
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
                    <ColorInput label="" value={easyColor} onChange={setEasyColor} disabled={isReadOnly} />
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
                    <Select defaultValue={font} onValueChange={setFont} disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {TrustCenterWatermarkConfigFontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {TrustCenterWatermarkConfigFontMapper[font.value as TrustCenterWatermarkConfigFont]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ColorInput label="Foreground color" value={foreground} onChange={setForeground} disabled={isReadOnly} />
                  <ColorInput label="Background color" value={background} onChange={setBackground} disabled={isReadOnly} />
                  <ColorInput label="Accent/brand color" value={accent} onChange={setAccent} disabled={isReadOnly} />
                  <ColorInput label="Secondary Foreground color" value={secondaryForeground} onChange={setSecondaryForeground} disabled={isReadOnly} />
                  <ColorInput label="Secondary Background color" value={secondaryBackground} onChange={setSecondaryBackground} disabled={isReadOnly} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            {hasPreviewDifference && hasPreviewDifference.assets && <SectionWarning />}
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
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={normalizeUrl(logoPreview)!} alt="Logo preview" className="max-h-28 object-contain" />
                        ) : (
                          <Eye className="h-6 w-6" />
                        )}
                      </div>
                    </div>

                    <div>
                      {showLogoLinkInputType === LogoLinkInputTypeEnum.FILE && !isReadOnly && (
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
                            <UrlInput disabled={isReadOnly} className="w-full" value={logoLink} onChange={setLogoLink} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6 mt-5">
                    <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        disabled={isReadOnly}
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
                    <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        disabled={isReadOnly}
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
                        {showFavIconInputType === FavIconInputTypeEnum.FILE && !isReadOnly && (
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
                              <UrlInput disabled={isReadOnly} className="w-full" value={faviconLink} onChange={setFaviconLink} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-6 mt-5">
                      <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                        <input
                          type="radio"
                          disabled={isReadOnly}
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
                      <label className={`flex items-center gap-1 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                        <input
                          type="radio"
                          disabled={isReadOnly}
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
      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onOpenChange={setIsConfirmationDialogOpen}
        onConfirm={() => handleSave('publish')}
        confirmationText={'Publish'}
        title={`Publish`}
        description={<>Publishing will apply these changes to your live site. We recommend reviewing the preview environment before proceeding. Changes may take up to 5 minutes to propagate</>}
      />
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={onCancelNavigation} />
    </div>
  )
}

export default BrandPage
