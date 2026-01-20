'use client'

import React, { useState } from 'react'
import { Eye, InfoIcon } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import UrlInput from './url-input'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from './helpers/useHandleUpdateSetting'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { normalizeUrl } from '@/utils/exportToCSV'

type Props = {
  setting: TrustCenterSetting
}

const BrandSection = ({ setting }: Props) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(setting?.logoFile?.presignedURL || setting?.logoRemoteURL || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoLink, setLogoLink] = useState(setting?.logoRemoteURL ?? '')
  const [showLogoLinkInput, setShowLogoLinkInput] = useState(false)

  const [faviconPreview, setFaviconPreview] = useState<string | null>(setting?.faviconFile?.presignedURL || setting?.faviconRemoteURL || null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconLink, setFaviconLink] = useState(setting?.faviconRemoteURL ?? '')
  const [showFaviconLinkInput, setShowFaviconLinkInput] = useState(false)

  const { updateTrustCenterSetting } = useHandleUpdateSetting()

  const [logoPending, setLogoPending] = useState(false)
  const [faviconPending, setFaviconPending] = useState(false)
  const [logoLinkPending, setLogoLinkPending] = useState(false)
  const [faviconLinkPending, setFaviconLinkPending] = useState(false)

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

  const handleSaveFaviconLink = async () => {
    if (!faviconLink) return
    try {
      setFaviconLinkPending(true)
      await updateTrustCenterSetting({
        id: setting?.id,
        input: {
          faviconRemoteURL: faviconLink,
          clearFaviconFile: true,
        },
      })
    } finally {
      setFaviconLinkPending(false)
    }
  }

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start">
      <h1 className="text-xl text-text-header font-medium">Brand</h1>

      <div className="flex flex-col">
        {/* Logo */}
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
                {!showLogoLinkInput && (
                  <>
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
                    <SaveButton onClick={handleSaveLogoFile} disabled={logoPending || !logoFile} isSaving={logoPending || logoLinkPending} />
                  </>
                )}

                {!showLogoLinkInput && (
                  <button type="button" onClick={() => setShowLogoLinkInput(true)} className="mt-1 text-xs bg-unset text-blue-500">
                    or enter URL
                  </button>
                )}

                {showLogoLinkInput && (
                  <div className="flex  flex-col gap-2 mt-6">
                    <div className="flex items-center gap-1">
                      <Label className="text-sm">URL</Label>
                      <SystemTooltip
                        icon={<InfoIcon className="text-brand-100" size={14} />}
                        content={<p>Location of hosted Logo file. It must link to a image file that contains a png, jpg, or svg image</p>}
                      />
                    </div>
                    <div className="flex gap-3 items-center mt-1">
                      <UrlInput className="w-full" value={logoLink} onChange={setLogoLink} />
                      <SaveButton className="w-auto" onClick={handleSaveLogoLink} isSaving={logoLinkPending} />
                    </div>
                  </div>
                )}
                {showLogoLinkInput && (
                  <button type="button" onClick={() => setShowLogoLinkInput(false)} className="mt-1 text-xs text-blue-500">
                    or upload file
                  </button>
                )}
              </div>
            </div>
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
                {!showFaviconLinkInput && (
                  <>
                    <div className="flex items-center gap-1 mb-2">
                      <Label className="block text-sm">Upload</Label>
                      <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Recommended size: 32x32px or 48x48px (max 1 MB)</p>} />
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
                    <SaveButton onClick={handleSaveFaviconFile} disabled={faviconPending || !faviconFile} className="mt-3 block" isSaving={faviconPending || faviconLinkPending} />
                  </>
                )}

                {!showFaviconLinkInput && (
                  <button type="button" onClick={() => setShowFaviconLinkInput(true)} className="mt-1 text-xs bg-unset text-blue-500">
                    or enter URL
                  </button>
                )}

                {showFaviconLinkInput && (
                  <div className="flex flex-col gap-2 mt-6">
                    <div className="flex items-center gap-1">
                      <Label className="text-sm">URL</Label>
                      <SystemTooltip
                        icon={<InfoIcon className="text-brand-100" size={14} />}
                        content={<p>Location of hosted favicon file. It must link to a image file that contains a png, jpg, or ico image</p>}
                      />
                    </div>
                    <div className="flex gap-3 items-center mt-1">
                      <UrlInput className="w-full" value={faviconLink} onChange={setFaviconLink} />
                      <SaveButton isSaving={faviconLinkPending} className="w-auto" onClick={handleSaveFaviconLink} disabled={faviconLinkPending} />
                    </div>
                  </div>
                )}

                {showFaviconLinkInput && (
                  <button type="button" onClick={() => setShowFaviconLinkInput(false)} className="mt-1 text-xs text-blue-500">
                    or upload file
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandSection
