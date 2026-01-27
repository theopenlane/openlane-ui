'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { AssetInputGroup } from './asset-input-group'
import { useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { useMemo, useState, useEffect } from 'react'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { normalizeUrl } from '@/utils/normalizeUrl'

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

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const previewSetting = trustCenter?.previewSetting
  const setting = trustCenter?.setting

  const [logoInputType, setLogoInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)
  const [faviconInputType, setFaviconInputType] = useState<InputTypeEnum>(InputTypeEnum.FILE)

  const formValues = watch()

  const logoPreview = useMemo(() => {
    if (isReadOnly) {
      return setting?.logoFile?.presignedURL ?? setting?.logoRemoteURL ?? null
    }

    if (formValues.logoFile) {
      return URL.createObjectURL(formValues.logoFile)
    }

    return previewSetting?.logoFile?.presignedURL ?? formValues.logoRemoteURL ?? null
  }, [isReadOnly, setting, formValues.logoFile, formValues.logoRemoteURL, previewSetting])

  const faviconPreview = useMemo(() => {
    if (isReadOnly) {
      return setting?.faviconFile?.presignedURL ?? setting?.faviconRemoteURL ?? null
    }

    if (formValues.faviconFile) {
      return URL.createObjectURL(formValues.faviconFile)
    }

    return previewSetting?.faviconFile?.presignedURL ?? formValues.faviconRemoteURL ?? null
  }, [isReadOnly, setting, formValues.faviconFile, formValues.faviconRemoteURL, previewSetting])

  useEffect(() => {
    if (isReadOnly) return

    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
      if (faviconPreview?.startsWith('blob:')) URL.revokeObjectURL(faviconPreview)
    }
  }, [isReadOnly, logoPreview, faviconPreview])

  const handleUpload = (type: 'logo' | 'favicon', uploadedFile: TUploadedFile) => {
    if (!uploadedFile.file || isReadOnly) return

    if (type === 'logo') {
      setValue('logoFile', uploadedFile.file, { shouldDirty: true })
      setValue('logoRemoteURL', '', { shouldDirty: true })
    } else {
      setValue('faviconFile', uploadedFile.file, { shouldDirty: true })
      setValue('faviconRemoteURL', '', { shouldDirty: true })
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
            link={isReadOnly ? setting?.logoRemoteURL ?? '' : formValues.logoRemoteURL ?? ''}
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
          />

          <div className="border-b my-2" />

          <AssetInputGroup
            label="Favicon"
            preview={faviconPreview}
            link={isReadOnly ? setting?.faviconRemoteURL ?? '' : formValues.faviconRemoteURL ?? ''}
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
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
