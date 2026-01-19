'use client'
import { Loading } from '@/components/shared/loading/loading'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { PageHeading } from '@repo/ui/page-heading'
import { useContext, useEffect, useMemo, useState } from 'react'
import { UpdateTrustCenterSettingsArgs, useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { BrandingHeader } from './sections/branding-header'
import { BrandingTextSection } from './sections/branding-text-section'
import { BrandingThemeSection } from './sections/branding-theme-section'
import { BrandingAssetsSection } from './sections/branding-assets-section'

export enum InputTypeEnum {
  URL = 'url',
  FILE = 'file',
}

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

  const [showLogoLinkInputType, setShowLogoLinkInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)
  const [showFavIconInputType, setShowFavIconInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)

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

  const setColorOrClear = (value: string | null | undefined, colorKey: string, clearKey: string) => (value ? { [colorKey]: value } : { [clearKey]: true })

  const handleSave = async (action: 'preview' | 'publish') => {
    if (!setting?.id) return
    if (action === 'preview' && !previewSetting?.id) return

    const payload: UpdateTrustCenterSettingsArgs = {
      id: action === 'preview' ? previewSetting?.id : setting?.id,
      input: {
        ...setColorOrClear(easyColor, 'primaryColor', 'clearPrimaryColor'),
        ...setColorOrClear(foreground, 'foregroundColor', 'clearForegroundColor'),
        ...setColorOrClear(background, 'backgroundColor', 'clearBackgroundColor'),
        ...setColorOrClear(secondaryForeground, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...setColorOrClear(secondaryBackground, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...setColorOrClear(accent, 'accentColor', 'clearAccentColor'),
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
          ...setColorOrClear(easyColor, 'primaryColor', 'clearPrimaryColor'),
          ...setColorOrClear(foreground, 'foregroundColor', 'clearForegroundColor'),
          ...setColorOrClear(background, 'backgroundColor', 'clearBackgroundColor'),
          ...setColorOrClear(secondaryForeground, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
          ...setColorOrClear(secondaryBackground, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
          ...setColorOrClear(accent, 'accentColor', 'clearAccentColor'),
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
        ...setColorOrClear(setting?.primaryColor, 'primaryColor', 'clearPrimaryColor'),
        ...setColorOrClear(setting?.foregroundColor, 'foregroundColor', 'clearForegroundColor'),
        ...setColorOrClear(setting?.backgroundColor, 'backgroundColor', 'clearBackgroundColor'),
        ...setColorOrClear(setting?.secondaryForegroundColor, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...setColorOrClear(setting?.secondaryBackgroundColor, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...setColorOrClear(setting?.accentColor, 'accentColor', 'clearAccentColor'),
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

        <BrandingHeader
          cnameRecord={cnameRecord}
          hasChanges={hasPreviewDifference?.any}
          onPreview={() => handleSave('preview')}
          onRevert={handleRevert}
          onPublish={() => setIsConfirmationDialogOpen(true)}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'published')} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>

        <BrandingTextSection title={title} setTitle={setTitle} overview={overview} setOverview={setOverview} isReadOnly={isReadOnly} hasWarning={hasPreviewDifference?.text} />

        <BrandingThemeSection
          selectedThemeType={selectedThemeType}
          setSelectedThemeType={setSelectedThemeType}
          font={font}
          setFont={setFont}
          colors={{
            easyColor,
            setEasyColor,
            foreground,
            setForeground,
            background,
            setBackground,
            accent,
            setAccent,
            secondaryForeground,
            setSecondaryForeground,
            secondaryBackground,
            setSecondaryBackground,
          }}
          isReadOnly={isReadOnly}
          hasWarning={hasPreviewDifference?.theme}
        />

        <BrandingAssetsSection
          logo={{
            preview: logoPreview,
            link: logoLink,
            setLink: setLogoLink,
            onUpload: handleLogoUpload,
            inputType: showLogoLinkInputType,
            setInputType: setShowLogoLinkInputType,
          }}
          favicon={{
            preview: faviconPreview,
            link: faviconLink,
            setLink: setFaviconLink,
            onUpload: handleFaviconUpload,
            inputType: showFavIconInputType,
            setInputType: setShowFavIconInputType,
          }}
          isReadOnly={isReadOnly}
          hasWarning={hasPreviewDifference?.assets}
          normalizeUrl={normalizeUrl}
        />
      </div>

      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onOpenChange={setIsConfirmationDialogOpen}
        onConfirm={() => handleSave('publish')}
        confirmationText="Publish"
        title="Publish"
        description="Publishing will apply these changes to your live site. We recommend reviewing the preview environment before proceeding. Changes may take up to 5 minutes to propagate"
      />
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={onCancelNavigation} />
    </div>
  )
}

export default BrandPage
