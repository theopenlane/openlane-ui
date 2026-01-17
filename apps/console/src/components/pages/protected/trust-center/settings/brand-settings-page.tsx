'use client'
import { Loading } from '@/components/shared/loading/loading'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { PageHeading } from '@repo/ui/page-heading'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { BookUp, Eye } from 'lucide-react'
import { Button } from '@repo/ui/button'
import UrlInput from './url-input'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { BrandSettingsTitleAndOverviewSection } from './brand-settings-title-and-overview-section'
import { BrandSettingsThemewSection } from './brand-settings-theme-section'
import { BrandLogoIconSection } from './brand-logo-icon-section'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const BrandPage: React.FC = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const cnameRecord = trustCenter?.previewDomain?.cnameRecord
  const setting = trustCenter?.setting
  const previewSetting = trustCenter?.previewSetting
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
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const [faviconPreview, setFaviconPreview] = useState<string | null>(setting?.faviconFile?.presignedURL || setting?.faviconRemoteURL || null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconLink, setFaviconLink] = useState(setting?.faviconRemoteURL ?? '')

  const [selectedThemeType, setSelectedThemeType] = useState<TrustCenterSettingTrustCenterThemeMode>(setting?.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)

  const initialValues = useMemo(
    () => ({
      title: setting?.title ?? '',
      overview: setting?.overview ?? '',
      primaryColor: setting?.primaryColor ?? '#f0f0e0',
      foregroundColor: setting?.foregroundColor ?? '#f0f0e0',
      backgroundColor: setting?.backgroundColor ?? '#f0f0e0',
      secondaryForegroundColor: setting?.secondaryForegroundColor ?? '#f0f0e0',
      secondaryBackgroundColor: setting?.secondaryBackgroundColor ?? '#f0f0e0',
      accentColor: setting?.accentColor ?? '#f0f0e0',
      font: setting?.font ?? 'outfit',
      themeMode: setting?.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY,
      logoRemoteURL: setting?.logoRemoteURL ?? '',
      faviconRemoteURL: setting?.faviconRemoteURL ?? '',
    }),
    [setting],
  )

  const isDirty = useMemo(() => {
    if (!setting) return false

    const hasTextChanged = title !== initialValues.title || overview !== initialValues.overview || font !== initialValues.font || selectedThemeType !== initialValues.themeMode

    const hasColorsChanged =
      easyColor !== initialValues.primaryColor ||
      foreground !== initialValues.foregroundColor ||
      background !== initialValues.backgroundColor ||
      accent !== initialValues.accentColor ||
      secondaryForeground !== initialValues.secondaryForegroundColor ||
      secondaryBackground !== initialValues.secondaryBackgroundColor

    const hasAssetsChanged = logoFile !== null || faviconFile !== null || logoLink !== initialValues.logoRemoteURL || faviconLink !== initialValues.faviconRemoteURL

    return hasTextChanged || hasColorsChanged || hasAssetsChanged
  }, [
    title,
    overview,
    font,
    selectedThemeType,
    easyColor,
    foreground,
    background,
    accent,
    secondaryForeground,
    secondaryBackground,
    logoFile,
    faviconFile,
    logoLink,
    faviconLink,
    initialValues,
    setting,
  ])

  const navGuard = useNavigationGuard({ enabled: isDirty })

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Branding', href: '/trust-center/branding' }])
  }, [setCrumbs])

  useEffect(() => {
    if (setting) {
      setTitle(setting.title || '')
      setOverview(setting.overview || '')
      setBackground(setting.backgroundColor || '#f0f0e0')
      setSecondaryBackground(setting.secondaryBackgroundColor || '#f0f0e0')
      setSecondaryForeground(setting.secondaryForegroundColor || '#f0f0e0')
      setForeground(setting.foregroundColor || '#f0f0e0')
      setAccent(setting.accentColor || '#f0f0e0')
      setSecondaryBackground(setting.secondaryBackgroundColor || '#f0f0e0')
      setFont(setting.font || 'outfit')
      setEasyColor(setting.primaryColor || '#f0f0e0')
      setSelectedThemeType(setting.themeMode ?? TrustCenterSettingTrustCenterThemeMode.EASY)
    }
  }, [setting])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  if (!setting) {
    return <div className="p-6">No trust center settings found.</div>
  }

  const handleSave = async (savePreview: boolean) => {
    if (!setting?.id) {
      errorNotification({ title: 'No setting found', description: 'No setting found' })
      return
    }

    if (savePreview && !previewSetting?.id) {
      errorNotification({ title: 'No preview setting found', description: 'No preview setting found' })
      return
    }
    try {
      await updateTrustCenterSetting({
        id: savePreview ? previewSetting?.id : setting?.id,
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
      successNotification({ title: 'Success', description: 'Settings successfully saved' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[1200px] grid gap-6">
        <PageHeading heading="Branding" />
        <div className="flex items-center gap-5 w-full">
          <Button onClick={() => handleSave(true)} className="h-10" type="button" variant="secondary" icon={<Eye size={16} strokeWidth={2} />} iconPosition="left">
            Preview
          </Button>

          <div className="flex items-center gap-10 flex-1">
            <UrlInput disabled hasCopyButton placeholder={cnameRecord ?? 'Preview URL not available yet'} value={cnameRecord ?? ''} className="h-10" />
            <Button className="h-10 ml-auto" variant="primary" icon={<BookUp size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setIsConfirmationDialogOpen(true)}>
              Publish
            </Button>
          </div>
        </div>
        <BrandSettingsTitleAndOverviewSection title={title} setTitle={setTitle} overview={overview} setOverview={setOverview}></BrandSettingsTitleAndOverviewSection>
        <BrandSettingsThemewSection
          selectedThemeType={selectedThemeType}
          setSelectedThemeType={setSelectedThemeType}
          easyColor={easyColor}
          setEasyColor={setEasyColor}
          font={font}
          setFont={setFont}
          foreground={foreground}
          setForeground={setForeground}
          background={background}
          setBackground={setBackground}
          accent={accent}
          setAccent={setAccent}
          secondaryForeground={secondaryForeground}
          setSecondaryForeground={setSecondaryForeground}
          secondaryBackground={secondaryBackground}
          setSecondaryBackground={setSecondaryBackground}
        ></BrandSettingsThemewSection>
        <BrandLogoIconSection
          logoPreview={logoPreview}
          setLogoPreview={setLogoPreview}
          setLogoFile={setLogoFile}
          logoLink={logoLink}
          setLogoLink={setLogoLink}
          faviconPreview={faviconPreview}
          setFaviconPreview={setFaviconPreview}
          setFaviconFile={setFaviconFile}
          faviconLink={faviconLink}
          setFaviconLink={setFaviconLink}
        ></BrandLogoIconSection>
      </div>
      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onOpenChange={setIsConfirmationDialogOpen}
        onConfirm={() => handleSave(false)}
        confirmationText={'Publish'}
        title={`Publish`}
        description={<>Publishing will apply these changes to your live site. We recommend reviewing the preview environment before proceeding. Changes may take up to 5 minutes to propagate</>}
      />
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}

export default BrandPage
