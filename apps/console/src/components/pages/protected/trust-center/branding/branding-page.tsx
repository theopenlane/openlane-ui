'use client'

import { TrustCenterPreviewSetting, TrustCenterSetting, useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TrustCenterSettingTrustCenterThemeMode } from '@repo/codegen/src/schema'
import { PageHeading } from '@repo/ui/page-heading'
import { useContext, useEffect, useMemo, useState } from 'react'
import { UpdateTrustCenterSettingsArgs, useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { BrandingHeader } from './sections/branding-header'
import { BrandingTextSection } from './sections/branding-text-section'
import { BrandingThemeSection } from './sections/branding-theme-section'
import { BrandingAssetsSection } from './sections/branding-assets-section'
import { FormProvider } from 'react-hook-form'
import { BrandFormValues, useBrandForm } from './brand-schema'
import { TrustCenterSkeleton } from '../skeleton/trust-center-skeleton'
import { BrandingCompanyInfoSection } from './sections/branding-company-info-section'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'

export enum InputTypeEnum {
  URL = 'url',
  FILE = 'file',
}

const BrandPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { updateTrustCenterSetting } = useHandleUpdateSetting()
  const { convertToHtml } = usePlateEditor()

  const { data, isLoading, error } = useGetTrustCenter()
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const cnameRecord = trustCenter?.previewDomain?.cnameRecord

  const setting: TrustCenterSetting = trustCenter?.setting
  const previewSetting: TrustCenterPreviewSetting = trustCenter?.previewSetting

  const [activeTab, setActiveTab] = useState<'preview' | 'published'>('preview')
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)

  const methods = useBrandForm()

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods

  const navGuard = useNavigationGuard({ enabled: isDirty })

  useEffect(() => {
    if (previewSetting) {
      reset({
        title: previewSetting.title ?? '',
        overview: previewSetting.overview ?? '',
        securityContact: previewSetting.securityContact ?? '',
        primaryColor: previewSetting.primaryColor ?? '#f0f0e0',
        foregroundColor: previewSetting.foregroundColor ?? '#f0f0e0',
        backgroundColor: previewSetting.backgroundColor ?? '#f0f0e0',
        secondaryForegroundColor: previewSetting.secondaryForegroundColor ?? '#f0f0e0',
        secondaryBackgroundColor: previewSetting.secondaryBackgroundColor ?? '#f0f0e0',
        accentColor: previewSetting.accentColor ?? '#f0f0e0',
        font: previewSetting.font ?? 'outfit',
        themeMode: (previewSetting.themeMode as TrustCenterSettingTrustCenterThemeMode) ?? TrustCenterSettingTrustCenterThemeMode.EASY,
        logoRemoteURL: previewSetting.logoRemoteURL ?? '',
        faviconRemoteURL: previewSetting.faviconRemoteURL ?? '',
        logoFile: null,
        faviconFile: null,
        companyName: previewSetting.companyName ?? '',
        companyDescription: previewSetting.companyDescription ?? '',
        companyDomain: previewSetting.companyDomain ?? '',
      })
    }
  }, [previewSetting, reset])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Branding', href: '/trust-center/branding' }])
  }, [setCrumbs])

  const hasPreviewDifference = useMemo(() => {
    if (!setting || !previewSetting) return null
    const companyInfoDiff =
      setting.companyName !== previewSetting.companyName || setting.companyDescription !== previewSetting.companyDescription || setting.companyDomain !== previewSetting.companyDomain
    const textDiff = setting.title !== previewSetting.title || setting.overview !== previewSetting.overview || setting.securityContact !== previewSetting.securityContact
    const themeDiff = setting.themeMode !== previewSetting.themeMode || setting.font !== previewSetting.font || setting.primaryColor !== previewSetting.primaryColor
    const assetDiff = setting.logoFile?.id !== previewSetting.logoFile?.id || setting.logoRemoteURL !== previewSetting.logoRemoteURL
    return { companyInfo: companyInfoDiff, text: textDiff, theme: themeDiff, assets: assetDiff, any: textDiff || themeDiff || assetDiff }
  }, [setting, previewSetting])

  const setColorOrClear = (value: string | null | undefined, colorKey: string, clearKey: string) => (value ? { [colorKey]: value } : { [clearKey]: true })

  const onSubmit = async (values: BrandFormValues, action: 'preview' | 'publish') => {
    const targetSettingId = action === 'preview' ? previewSetting?.id : setting?.id
    if (!targetSettingId) return

    const overviewValue = values.overview
    const overview = typeof overviewValue === 'string' ? overviewValue : overviewValue ? await convertToHtml(overviewValue as Value) : ''

    const payload: UpdateTrustCenterSettingsArgs = {
      id: targetSettingId,
      input: {
        ...setColorOrClear(values.primaryColor, 'primaryColor', 'clearPrimaryColor'),
        ...setColorOrClear(values.foregroundColor, 'foregroundColor', 'clearForegroundColor'),
        ...setColorOrClear(values.backgroundColor, 'backgroundColor', 'clearBackgroundColor'),
        ...setColorOrClear(values.secondaryForegroundColor, 'secondaryForegroundColor', 'clearSecondaryForegroundColor'),
        ...setColorOrClear(values.secondaryBackgroundColor, 'secondaryBackgroundColor', 'clearSecondaryBackgroundColor'),
        ...setColorOrClear(values.accentColor, 'accentColor', 'clearAccentColor'),
        font: values.font,
        themeMode: values.themeMode,
        title: values.title,
        overview,
        securityContact: values.securityContact || null,
        clearSecurityContact: !values.securityContact,
        companyName: values.companyName,
        companyDescription: values.companyDescription,
        companyDomain: values.companyDomain,
        clearCompanyDomain: !values.companyDomain,
        clearCompanyDescription: !values.companyDescription,
        clearCompanyName: !values.companyName,
      },
    }

    if (values.logoFile) {
      payload.logoFile = values.logoFile
      payload.input.clearLogoRemoteURL = true
    } else if (action === 'publish' && previewSetting?.logoFile?.id) {
      payload.input.logoFileID = previewSetting.logoFile.id
      payload.input.clearLogoRemoteURL = true
    } else if (values.logoRemoteURL) {
      payload.input.logoRemoteURL = values.logoRemoteURL
      payload.input.clearLogoFile = true
    }

    if (values.faviconFile) {
      payload.faviconFile = values.faviconFile
      payload.input.clearFaviconRemoteURL = true
    } else if (action === 'publish' && previewSetting?.faviconFile?.id) {
      payload.input.faviconFileID = previewSetting.faviconFile.id
      payload.input.clearFaviconRemoteURL = true
    } else if (values.faviconRemoteURL) {
      payload.input.faviconRemoteURL = values.faviconRemoteURL
      payload.input.clearFaviconFile = true
    }

    const resp = await updateTrustCenterSetting(payload)

    if (action === 'publish' && previewSetting?.id) {
      await updateTrustCenterSetting({
        id: previewSetting.id,
        input: {
          ...payload.input,
          logoFileID: resp?.trustCenterSetting.logoFile?.id,
          logoRemoteURL: resp?.trustCenterSetting.logoRemoteURL,
          faviconFileID: resp?.trustCenterSetting.faviconFile?.id,
          faviconRemoteURL: resp?.trustCenterSetting.faviconRemoteURL,
        },
      })
    }
    setIsConfirmationDialogOpen(false)
  }

  const handleRevert = () => {
    if (!previewSetting?.id || !setting) return
    updateTrustCenterSetting({
      id: previewSetting.id,
      input: {
        title: setting.title,
        overview: setting.overview,
        securityContact: setting.securityContact || null,
        clearSecurityContact: !setting.securityContact,
        primaryColor: setting.primaryColor,
        foregroundColor: setting.foregroundColor,
        backgroundColor: setting.backgroundColor,
        accentColor: setting.accentColor,
        secondaryForegroundColor: setting.secondaryForegroundColor,
        secondaryBackgroundColor: setting.secondaryBackgroundColor,
        font: setting.font,
        themeMode: setting.themeMode,
        logoFileID: setting.logoFile?.id,
        logoRemoteURL: setting.logoRemoteURL,
        faviconFileID: setting.faviconFile?.id,
        faviconRemoteURL: setting.faviconRemoteURL,
        companyName: setting.companyName,
        companyDescription: setting.companyDescription,
        companyDomain: setting.companyDomain,
      },
    })
  }

  if (isLoading) return <TrustCenterSkeleton />
  if (error || !setting) return <div className="p-6 text-red-600">Error loading settings.</div>

  const isReadOnly = activeTab === 'published'
  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="w-full flex justify-center py-4">
        <div className="w-full max-w-[1200px] grid gap-6">
          <PageHeading heading="Branding" />
          <BrandingHeader
            cnameRecord={cnameRecord}
            hasChanges={hasPreviewDifference?.any}
            onPreview={handleSubmit((v) => onSubmit(v, 'preview'))}
            onRevert={handleRevert}
            onPublish={() => setIsConfirmationDialogOpen(true)}
          />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'published')} className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
          </Tabs>
          <BrandingCompanyInfoSection hasWarning={hasPreviewDifference?.companyInfo} isReadOnly={isReadOnly} setting={setting} />
          <BrandingTextSection hasWarning={hasPreviewDifference?.text} isReadOnly={isReadOnly} setting={setting} />

          <BrandingThemeSection isReadOnly={isReadOnly} hasWarning={hasPreviewDifference?.theme} setting={setting} />

          <BrandingAssetsSection isReadOnly={isReadOnly} hasWarning={hasPreviewDifference?.assets} />
        </div>

        <ConfirmationDialog
          open={isConfirmationDialogOpen}
          onOpenChange={setIsConfirmationDialogOpen}
          onConfirm={handleSubmit((v) => onSubmit(v, 'publish'))}
          confirmationText="Publish"
          title="Publish"
          description="Publishing will apply these changes to your live site..."
        />
        <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={() => navGuard.reject()} />
      </form>
    </FormProvider>
  )
}

export default BrandPage
