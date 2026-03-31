'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { AssetInputGroup } from './asset-input-group'
import { useFormContext } from 'react-hook-form'
import { type BrandFormValues } from '../brand-schema'
import { useMemo, useState, useEffect } from 'react'
import { type TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { toBase64DataUri } from '@/lib/image-utils'

export enum InputTypeEnum {
  URL = 'url',
  FILE = 'file',
}

interface BrandingAssetsSectionProps {
  isReadOnly: boolean
  hasWarning?: boolean
}

export const BrandingAssetsSection = ({ isReadOnly, hasWarning }: BrandingAssetsSectionProps) => {
  const { watch, setValue } = useFormContext<BrandFormValues>()
  const { data } = useGetTrustCenter()
  const [isImageValidSize, setIsImageValidSize] = useState<boolean | null>(null)
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const previewSetting = trustCenter?.previewSetting
  const setting = trustCenter?.setting

  const [logoInputType, setLogoInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)
  const [faviconInputType, setFaviconInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)

  const formValues = watch()

  const logoPreview = useMemo(() => {
    if (isReadOnly) {
      return (setting?.logoFile?.base64 ? toBase64DataUri(setting.logoFile.base64) : null) ?? setting?.logoRemoteURL ?? null
    }

    if (formValues.logoFile) {
      return URL.createObjectURL(formValues.logoFile)
    }

    return (previewSetting?.logoFile?.base64 ? toBase64DataUri(previewSetting.logoFile.base64) : null) ?? formValues.logoRemoteURL ?? null
  }, [isReadOnly, setting, formValues.logoFile, formValues.logoRemoteURL, previewSetting])

  const faviconPreview = useMemo(() => {
    if (isReadOnly) {
      return (setting?.faviconFile?.base64 ? toBase64DataUri(setting.faviconFile.base64) : null) ?? setting?.faviconRemoteURL ?? null
    }

    if (formValues.faviconFile) {
      return URL.createObjectURL(formValues.faviconFile)
    }

    return (previewSetting?.faviconFile?.base64 ? toBase64DataUri(previewSetting.faviconFile.base64) : null) ?? formValues.faviconRemoteURL ?? null
  }, [isReadOnly, setting, formValues.faviconFile, formValues.faviconRemoteURL, previewSetting])

  const toDataUri = (base64: string) => {
    if (base64.startsWith('data:')) return base64
    return `data:image/jpeg;base64,${base64}`
  }

  const heroImagePreview = useMemo(() => {
    if (isReadOnly) {
      const b64 = setting?.heroImageFile?.base64
      return b64 ? toDataUri(b64) : null
    }

    if (formValues.clearHeroImage) {
      return null
    }

    if (formValues.heroImageFile) {
      return URL.createObjectURL(formValues.heroImageFile)
    }

    const b64 = previewSetting?.heroImageFile?.base64
    return b64 ? toDataUri(b64) : null
  }, [isReadOnly, setting, formValues.heroImageFile, formValues.clearHeroImage, previewSetting])

  useEffect(() => {
    if (isReadOnly) return

    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
      if (faviconPreview?.startsWith('blob:')) URL.revokeObjectURL(faviconPreview)
      if (heroImagePreview?.startsWith('blob:')) URL.revokeObjectURL(heroImagePreview)
    }
  }, [isReadOnly, logoPreview, faviconPreview, heroImagePreview])

  const handleUpload = (type: 'logo' | 'favicon' | 'heroImage', uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file || isReadOnly) return

    if (type === 'logo') {
      setValue('logoFile', uploadedFile.file, { shouldDirty: true })
      setValue('logoRemoteURL', '', { shouldDirty: true })
    } else if (type === 'favicon') {
      const isValidSize =
        uploadedFile.width !== undefined && uploadedFile.height !== undefined && uploadedFile.width >= 32 && uploadedFile.height >= 32 && uploadedFile.width <= 120 && uploadedFile.height <= 120
      setIsImageValidSize(isValidSize)
      setValue('faviconFile', uploadedFile.file, { shouldDirty: true })
      setValue('faviconRemoteURL', '', { shouldDirty: true })
    } else if (type === 'heroImage') {
      setValue('heroImageFile', uploadedFile.file, { shouldDirty: true })
      setValue('clearHeroImage', false)
    }
  }

  return (
    <Card>
      <CardContent>
        {hasWarning && <SectionWarning />}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-6">Brand</p>
            <p className="text-sm text-inverted-muted-foreground font-medium leading-6">Upload your logo and favicon to brand your Trust Center.</p>
          </div>

          <AssetInputGroup
            label="Logo"
            preview={logoPreview}
            link={isReadOnly ? (setting?.logoRemoteURL ?? '') : (formValues.logoRemoteURL ?? '')}
            setLink={(v) => {
              if (isReadOnly) return
              setValue('logoRemoteURL', v, { shouldDirty: true })
            }}
            onUpload={(file) => handleUpload('logo', file)}
            inputType={logoInputType}
            setInputType={isReadOnly ? () => {} : setLogoInputType}
            isReadOnly={isReadOnly}
            normalizeUrl={normalizeUrl}
            fileConfigs={{
              types: ['image/jpeg', 'image/png', 'image/svg+xml'],
              shortTypes: ['PNG', 'JPG', 'SVG'],
              maxSize: 5,
            }}
            enableCrop
          />

          <div className="border-b my-2" />

          <AssetInputGroup
            label="Favicon"
            preview={faviconPreview}
            link={isReadOnly ? (setting?.faviconRemoteURL ?? '') : (formValues.faviconRemoteURL ?? '')}
            setLink={(v) => {
              if (isReadOnly) return
              setValue('faviconRemoteURL', v, { shouldDirty: true })
            }}
            onUpload={(file) => handleUpload('favicon', file)}
            inputType={faviconInputType}
            setInputType={isReadOnly ? () => {} : setFaviconInputType}
            isReadOnly={isReadOnly}
            normalizeUrl={normalizeUrl}
            fileConfigs={{
              types: ['image/x-icon', 'image/png', 'image/jpeg', 'image/vnd.microsoft.icon'],
              shortTypes: ['ICO', 'PNG', 'JPG'],
              maxSize: 1,
              note: 'Recommended size: 32x32 or 64x64 · Max dimensions: 120x120',
            }}
            isImageValidSize={isImageValidSize}
          />

          <div className="border-b my-2" />
          <AssetInputGroup
            label="Hero Image"
            helperText="Used as a banner image at the top of your site. If not provided, the brand color gradient is used instead."
            preview={heroImagePreview}
            link=""
            setLink={() => {}}
            onUpload={(file) => handleUpload('heroImage', file)}
            inputType={InputTypeEnum.FILE}
            setInputType={() => {}}
            isReadOnly={isReadOnly}
            normalizeUrl={normalizeUrl}
            fileConfigs={{
              types: ['image/jpeg', 'image/png', 'image/webp'],
              shortTypes: ['PNG', 'JPG', 'WEBP'],
              maxSize: 5,
              note: 'Recommended size: 1600x600 (8:3 aspect ratio)',
            }}
            onRemove={() => {
              setValue('heroImageFile', null, { shouldDirty: true })
              setValue('clearHeroImage', true, { shouldDirty: true })
            }}
            enableCrop
            aspect={8 / 3}
            hideUrlOption
          />
        </div>
      </CardContent>
    </Card>
  )
}
