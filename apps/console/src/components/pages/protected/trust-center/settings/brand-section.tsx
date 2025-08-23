'use client'

import React, { useState } from 'react'
import { Eye, InfoIcon } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import UrlInput from './url-input'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'

type Props = {
  setting: TrustCenterSetting
}

const BrandSection = ({ setting }: Props) => {
  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(setting?.logoFile?.presignedURL || setting?.logoRemoteURL || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoLink, setLogoLink] = useState(setting?.logoRemoteURL ?? '')

  // Favicon
  const [faviconPreview, setFaviconPreview] = useState<string | null>(setting?.faviconFile?.presignedURL ?? null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  const { updateTrustCenterSetting } = useHandleUpdateSetting()

  // Local pending states
  const [logoPending, setLogoPending] = useState(false)
  const [faviconPending, setFaviconPending] = useState(false)
  const [logoLinkPending, setLogoLinkPending] = useState(false)

  // Handlers
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

  const handleSaveLogoFile = async () => {
    if (!logoFile) return
    try {
      setLogoPending(true)
      await updateTrustCenterSetting({
        id: setting?.id,
        input: { clearLogoRemoteURL: true },
        logoFile,
      })
    } finally {
      setLogoPending(false)
    }
  }

  const handleSaveFaviconFile = async () => {
    if (!faviconFile) return
    try {
      setFaviconPending(true)
      await updateTrustCenterSetting({
        id: setting?.id,
        input: { clearFaviconRemoteURL: true },
        faviconFile,
      })
    } finally {
      setFaviconPending(false)
    }
  }

  const handleSaveLogoLink = async () => {
    if (!logoLink) return
    try {
      setLogoLinkPending(true)
      await updateTrustCenterSetting({
        id: setting?.id,
        input: {
          logoRemoteURL: logoLink,
          clearLogoFile: true,
        },
      })
    } finally {
      setLogoLinkPending(false)
    }
  }

  const normalizeUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url
    }
    return `https://${url}`
  }

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start">
      <h1 className="text-xl text-text-header font-medium">Brand</h1>

      <div className="flex flex-col">
        {/* Logo */}
        <p className="mb-2 font-medium">Logo</p>
        <div className="flex gap-7 border-b pb-8">
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
            <div className="flex items-center gap-1 mb-2">
              <Label className="block text-sm">Upload</Label>
              <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Recommended: PNG, JPG, SVG (max 5 MB)</p>} />
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
            <Button onClick={handleSaveLogoFile} disabled={logoPending || !logoFile} className="mt-3">
              {logoPending ? 'Saving…' : 'Save Logo'}
            </Button>

            <div className="grid gap-2 mt-6">
              <Label>Logo link</Label>
              <div className="flex items-center gap-1">
                <Label className="text-sm">URL</Label>
                <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>When the logo is clicked, users will be redirected here.</p>} />
              </div>
              <div className="flex gap-3 items-center mt-2.5">
                <UrlInput className="w-full" value={logoLink} onChange={setLogoLink} />
                <Button className="w-auto" onClick={handleSaveLogoLink} disabled={logoLinkPending}>
                  {logoLinkPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-text-informational -mt-0.5">When logo clicked, it&apos;ll link to this</p>
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div className="flex flex-col mt-8">
          <p className="mb-2 font-medium">Favicon</p>
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
              <div className="flex items-center gap-1 mb-2">
                <Label className="block text-sm">Upload</Label>
                <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Recommended size: 32×32px or 48×48px (max 1 MB)</p>} />
              </div>
              <div className="w-[417px]">
                <FileUpload
                  acceptedFileTypes={['image/x-icon', 'image/png', 'image/jpeg']}
                  onFileUpload={handleFaviconUpload}
                  acceptedFileTypesShort={['ICO', 'PNG', 'JPG']}
                  maxFileSizeInMb={1}
                  multipleFiles={false}
                />
              </div>
              <Button onClick={handleSaveFaviconFile} disabled={faviconPending || !faviconFile} className="mt-3">
                {faviconPending ? 'Saving…' : 'Save Favicon'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandSection
