'use client'

import { type TrustCenterPreviewSetting, type TrustCenterSetting, useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { TrustCenterSettingTrustCenterThemeMode, type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { PageHeading } from '@repo/ui/page-heading'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { type UpdateTrustCenterSettingsArgs, useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNavigationGuard } from 'nextjs-nav-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { BrandingHeader } from './sections/branding-header'
import { BrandingTextSection } from './sections/branding-text-section'
import { BrandingThemeSection } from './sections/branding-theme-section'
import { BrandingAssetsSection } from './sections/branding-assets-section'
import { FormProvider } from 'react-hook-form'
import { type BrandFormValues, DEFAULT_BRAND_COLOR, useBrandForm } from './brand-schema'
import { TrustCenterSkeleton } from '../skeleton/trust-center-skeleton'
import { BrandingCompanyInfoSection } from './sections/branding-company-info-section'
import { BrandingDomainPull } from './sections/branding-domain-pull'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { getBrandingPreviewDifference } from './helpers/preview-difference'
import { UnpublishedChangesWarning } from './section-warning'
import { useFixedToolbarOffset } from '@/hooks/useFixedToolbarOffset'
import { buildPreviewUrl } from './helpers/preview-url'
import { clearableSettingInput, FAVICON_ASSET, LOGO_ASSET, previewAssetInput, publishAssetInput } from './helpers/branding-setting-input'
import { useChangedInput } from '@/hooks/useChangedInput'

export enum InputTypeEnum {
  URL = 'url',
  FILE = 'file',
}

const brandColor = (value?: string | null) => normalizeHexColor(value) ?? DEFAULT_BRAND_COLOR

const BrandPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { updateTrustCenterSetting } = useHandleUpdateSetting()
  const { convertToHtml } = usePlateEditor()

  const { data, isLoading, error } = useGetTrustCenter()
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const cnameRecord = trustCenter?.previewDomain?.cnameRecord
  const previewUrl = buildPreviewUrl(cnameRecord)

  const setting: TrustCenterSetting = trustCenter?.setting
  const previewSetting: TrustCenterPreviewSetting = trustCenter?.previewSetting

  const { stickyChromeRef, fixedToolbarOffset } = useFixedToolbarOffset()

  const [activeTab, setActiveTab] = useState<'preview' | 'published'>('preview')
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [pulledBrandingCount, setPulledBrandingCount] = useState(0)

  const handleBrandingPulled = useCallback(() => setPulledBrandingCount((count) => count + 1), [])

  const methods = useBrandForm()

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods

  const buildChangedInput = useChangedInput(methods)

  const [isFormSettled, setIsFormSettled] = useState(false)
  const hasUnsavedChanges = isFormSettled && isDirty

  const navGuard = useNavigationGuard({ enabled: hasUnsavedChanges })

  useEffect(() => {
    if (previewSetting) {
      setIsFormSettled(false)
      const values = {
        title: previewSetting.title ?? '',
        overview: previewSetting.overview ?? '',
        securityContact: previewSetting.securityContact ?? '',
        statusPageURL: previewSetting.statusPageURL ?? '',
        primaryColor: brandColor(previewSetting.primaryColor),
        foregroundColor: brandColor(previewSetting.foregroundColor),
        backgroundColor: brandColor(previewSetting.backgroundColor),
        secondaryForegroundColor: brandColor(previewSetting.secondaryForegroundColor),
        secondaryBackgroundColor: brandColor(previewSetting.secondaryBackgroundColor),
        accentColor: brandColor(previewSetting.accentColor),
        font: previewSetting.font ?? 'outfit',
        themeMode: (previewSetting.themeMode as TrustCenterSettingTrustCenterThemeMode) ?? TrustCenterSettingTrustCenterThemeMode.EASY,
        logoRemoteURL: previewSetting.logoRemoteURL ?? '',
        faviconRemoteURL: previewSetting.faviconRemoteURL ?? '',
        logoFile: null,
        faviconFile: null,
        companyName: previewSetting.companyName ?? '',
        companyDescription: previewSetting.companyDescription ?? '',
        companyDomain: previewSetting.companyDomain ?? '',
      }
      reset(values)
      const timeoutId = setTimeout(() => {
        const currentValues = methods.getValues()
        reset(currentValues)
        setIsFormSettled(true)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [previewSetting, pulledBrandingCount, reset, methods])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Branding', href: '/trust-center/branding' },
    ])
  }, [setCrumbs])

  const hasPreviewDifference = useMemo(() => getBrandingPreviewDifference(setting, previewSetting), [setting, previewSetting])
  const unpublishedWarning = <UnpublishedChangesWarning previewUrl={previewUrl} />

  const buildSettingInput = async (values: BrandFormValues): Promise<UpdateTrustCenterSettingInput> => ({
    ...clearableSettingInput(values),
    font: values.font,
    themeMode: values.themeMode,
    title: values.title,
    overview: typeof values.overview === 'string' ? values.overview.trim() : values.overview ? await convertToHtml(values.overview) : '',
  })

  const buildPreviewInput = async (values: BrandFormValues): Promise<UpdateTrustCenterSettingInput> => ({
    ...(await buildSettingInput(values)),
    ...previewAssetInput(LOGO_ASSET, values.logoFile, values.logoRemoteURL),
    ...previewAssetInput(FAVICON_ASSET, values.faviconFile, values.faviconRemoteURL),
  })

  const buildPublishInput = async (values: BrandFormValues): Promise<UpdateTrustCenterSettingInput> => ({
    ...(await buildSettingInput(values)),
    ...publishAssetInput(LOGO_ASSET, values.logoFile, previewSetting?.logoFile?.id, values.logoRemoteURL),
    ...publishAssetInput(FAVICON_ASSET, values.faviconFile, previewSetting?.faviconFile?.id, values.faviconRemoteURL),
  })

  const stagedUploads = (values: BrandFormValues): Pick<UpdateTrustCenterSettingsArgs, 'logoFile' | 'faviconFile'> => ({
    logoFile: values.logoFile ?? undefined,
    faviconFile: values.faviconFile ?? undefined,
  })

  const savePreview = async (values: BrandFormValues) => {
    if (!previewSetting?.id) return

    const input = await buildChangedInput(values, buildPreviewInput)
    const uploads = stagedUploads(values)

    if (Object.keys(input).length === 0 && !uploads.logoFile && !uploads.faviconFile) {
      reset()
      return
    }

    await updateTrustCenterSetting({ id: previewSetting.id, input, ...uploads })
  }

  const publish = async (values: BrandFormValues) => {
    if (!setting?.id) return

    const input = await buildPublishInput(values)
    const published = await updateTrustCenterSetting({ id: setting.id, input, ...stagedUploads(values) })
    if (!published) return

    if (previewSetting?.id) {
      const mirrored = await updateTrustCenterSetting({
        id: previewSetting.id,
        input: {
          ...input,
          logoFileID: published.trustCenterSetting.logoFile?.id,
          logoRemoteURL: published.trustCenterSetting.logoRemoteURL,
          faviconFileID: published.trustCenterSetting.faviconFile?.id,
          faviconRemoteURL: published.trustCenterSetting.faviconRemoteURL,
        },
      })
      if (!mirrored) return
    }
    setIsConfirmationDialogOpen(false)
  }

  const handleRevert = () => {
    if (!previewSetting?.id || !setting) return
    updateTrustCenterSetting({
      id: previewSetting.id,
      input: {
        ...clearableSettingInput(setting),
        title: setting.title,
        overview: setting.overview,
        ...(setting.font ? { font: setting.font } : { clearFont: true }),
        themeMode: setting.themeMode,
        ...publishAssetInput(LOGO_ASSET, undefined, setting.logoFile?.id, setting.logoRemoteURL),
        ...publishAssetInput(FAVICON_ASSET, undefined, setting.faviconFile?.id, setting.faviconRemoteURL),
      },
    })
  }

  if (isLoading) return <TrustCenterSkeleton />
  if (error || !setting) return <div className="p-6 text-red-600">Error loading settings.</div>

  const isReadOnly = activeTab === 'published'
  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="w-full flex justify-center py-4">
        <div className="isolate w-full max-w-[1200px] grid gap-6" style={fixedToolbarOffset}>
          <PageHeading heading="Branding" />
          <BrandingHeader
            ref={stickyChromeRef}
            previewUrl={previewUrl}
            hasUnsavedChanges={hasUnsavedChanges}
            hasPreviewChanges={hasPreviewDifference.any}
            isPreviewAvailable={hasPreviewDifference.comparable}
            onPreview={handleSubmit(savePreview)}
            onRevert={handleRevert}
            onPublish={() => setIsConfirmationDialogOpen(true)}
          />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'published')} className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
          </Tabs>
          <BrandingCompanyInfoSection warning={hasPreviewDifference.companyInfo ? unpublishedWarning : null} isReadOnly={isReadOnly} setting={setting} />
          <BrandingTextSection warning={hasPreviewDifference.text ? unpublishedWarning : null} isReadOnly={isReadOnly} setting={setting} />

          <BrandingThemeSection
            isReadOnly={isReadOnly}
            warning={hasPreviewDifference.theme ? unpublishedWarning : null}
            setting={setting}
            cnameRecord={cnameRecord}
            pullAction={<BrandingDomainPull isReadOnly={isReadOnly} onPulled={handleBrandingPulled} />}
          />

          <BrandingAssetsSection isReadOnly={isReadOnly} warning={hasPreviewDifference.assets ? unpublishedWarning : null} />
        </div>

        <ConfirmationDialog
          open={isConfirmationDialogOpen}
          onOpenChange={setIsConfirmationDialogOpen}
          onConfirm={handleSubmit(publish)}
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
