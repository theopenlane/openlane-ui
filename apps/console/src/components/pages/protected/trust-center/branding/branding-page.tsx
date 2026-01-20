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
import { normalizeUrl } from '@/utils/exportToCSV'

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
    if (previewSetting) {
      setTitle(previewSetting.title ?? '')
      setOverview(previewSetting.overview ?? '')
      setEasyColor(previewSetting.primaryColor ?? '#f0f0e0')
      setForeground(previewSetting.foregroundColor ?? '#f0f0e0')
      setBackground(previewSetting.backgroundColor ?? '#f0f0e0')
      setSecondaryForeground(previewSetting.secondaryForegroundColor ?? '#f0f0e0')
      setSecondaryBackground(previewSetting.secondaryBackgroundColor ?? '#f0f0e0')
      setAccent(previewSetting.accentColor ?? '#f0f0e0')
      setFont(previewSetting.font ?? 'outfit')
      setSelectedThemeType(previewSetting.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)
      setLogoLink(previewSetting.logoRemoteURL ?? '')
      setFaviconLink(previewSetting.faviconRemoteURL ?? '')
      setLogoPreview(previewSetting.logoFile?.presignedURL || previewSetting.logoRemoteURL || null)
      setFaviconPreview(previewSetting.faviconFile?.presignedURL || previewSetting.faviconRemoteURL || null)
      setLogoFile(null)
      setFaviconFile(null)
    }
  }, [previewSetting])

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

  const setColorOrClear = (value: string | null | undefined, colorKey: string, clearKey: string) => (value ? { [colorKey]: value } : { [clearKey]: true })

  const handleSave = async (action: 'preview' | 'publish') => {
    const targetSettingId = action === 'preview' ? previewSetting?.id : setting?.id
    if (!targetSettingId) return

    const payload: UpdateTrustCenterSettingsArgs = {
      id: targetSettingId,
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
      },
    }

    if (logoFile) {
      payload.logoFile = logoFile
      payload.input.clearLogoRemoteURL = true
    } else if (action === 'publish' && previewSetting?.logoFile?.id) {
      payload.input.logoFileID = previewSetting.logoFile.id
      payload.input.clearLogoRemoteURL = true
    } else if (logoLink) {
      payload.input.logoRemoteURL = logoLink
      payload.input.clearLogoFile = true
    }

    if (faviconFile) {
      payload.faviconFile = faviconFile
      payload.input.clearFaviconRemoteURL = true
    } else if (action === 'publish' && previewSetting?.faviconFile?.id) {
      payload.input.faviconFileID = previewSetting.faviconFile.id
      payload.input.clearFaviconRemoteURL = true
    } else if (faviconLink) {
      payload.input.faviconRemoteURL = faviconLink
      payload.input.clearFaviconFile = true
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
    if (!previewSetting?.id || !setting) return

    const payload: UpdateTrustCenterSettingsArgs = {
      id: previewSetting.id,
      input: {
        ...setColorOrClear(setting.primaryColor, 'primaryColor', 'clearPrimaryColor'),
        ...setColorOrClear(setting.foregroundColor, 'foregroundColor', 'clearForegroundColor'),
        ...setColorOrClear(setting.backgroundColor, 'backgroundColor', 'clearBackgroundColor'),
        ...setColorOrClear(setting.secondaryForegroundColor, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...setColorOrClear(setting.secondaryBackgroundColor, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...setColorOrClear(setting.accentColor, 'accentColor', 'clearAccentColor'),
        font: setting.font,
        themeMode: setting.themeMode,
        title: setting.title,
        overview: setting.overview,
      },
    }

    if (setting.logoFile?.id) {
      payload.input.logoFileID = setting.logoFile.id
      payload.input.clearLogoRemoteURL = true
    } else if (setting.logoRemoteURL) {
      payload.input.logoRemoteURL = setting.logoRemoteURL
      payload.input.clearLogoFile = true
    } else {
      payload.input.clearLogoFile = true
      payload.input.clearLogoRemoteURL = true
    }

    if (setting.faviconFile?.id) {
      payload.input.faviconFileID = setting.faviconFile.id
      payload.input.clearFaviconRemoteURL = true
    } else if (setting.faviconRemoteURL) {
      payload.input.faviconRemoteURL = setting.faviconRemoteURL
      payload.input.clearFaviconFile = true
    } else {
      payload.input.clearFaviconFile = true
      payload.input.clearFaviconRemoteURL = true
    }

    updateTrustCenterSetting(payload)
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
        <BrandingTextSection
          title={isReadOnly ? (setting.title ?? '') : title}
          setTitle={setTitle}
          overview={isReadOnly ? (setting.overview ?? '') : overview}
          setOverview={setOverview}
          isReadOnly={isReadOnly}
          hasWarning={hasPreviewDifference?.text}
        />
        <BrandingThemeSection
          selectedThemeType={isReadOnly ? setting.themeMode : selectedThemeType}
          setSelectedThemeType={setSelectedThemeType}
          font={isReadOnly ? (setting.font ?? 'outfit') : font}
          setFont={setFont}
          colors={{
            easyColor: isReadOnly ? (setting.primaryColor ?? '#f0f0e0') : easyColor,
            setEasyColor,
            foreground: isReadOnly ? (setting.foregroundColor ?? '#f0f0e0') : foreground,
            setForeground,
            background: isReadOnly ? (setting.backgroundColor ?? '#f0f0e0') : background,
            setBackground,
            accent: isReadOnly ? (setting.accentColor ?? '#f0f0e0') : accent,
            setAccent,
            secondaryForeground: isReadOnly ? (setting.secondaryForegroundColor ?? '#f0f0e0') : secondaryForeground,
            setSecondaryForeground,
            secondaryBackground: isReadOnly ? (setting.secondaryBackgroundColor ?? '#f0f0e0') : secondaryBackground,
            setSecondaryBackground,
          }}
          isReadOnly={isReadOnly}
          hasWarning={hasPreviewDifference?.theme}
        />
        <BrandingAssetsSection
          logo={{
            preview: isReadOnly ? setting.logoFile?.presignedURL || setting.logoRemoteURL || null : logoPreview,
            link: isReadOnly ? (setting.logoRemoteURL ?? '') : logoLink,
            setLink: setLogoLink,
            onUpload: handleLogoUpload,
            inputType: showLogoLinkInputType,
            setInputType: setShowLogoLinkInputType,
          }}
          favicon={{
            preview: isReadOnly ? setting.faviconFile?.presignedURL || setting.faviconRemoteURL || null : faviconPreview,
            link: isReadOnly ? (setting.faviconRemoteURL ?? '') : faviconLink,
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
        description="Publishing will apply these changes to your live site..."
      />
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={() => navGuard.reject()} />
    </div>
  )
}

export default BrandPage
