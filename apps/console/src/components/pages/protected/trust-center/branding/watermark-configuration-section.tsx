'use client'

import React, { useEffect, useState } from 'react'
import { Eye, InfoIcon } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Input } from '@repo/ui/input'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { TrustCenterWatermarkConfig, useUpdateTrustCenterWatermarkConfig } from '@/lib/graphql-hooks/trust-center'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { normalizeUrl } from '@/utils/exportToCSV'

type Props = {
  watermarkConfig: TrustCenterWatermarkConfig | null
}

const WatermarkConfigurationSection = ({ watermarkConfig }: Props) => {
  const { id, file, text, fontSize, color, opacity, rotation } = watermarkConfig ?? {}

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(file?.presignedURL ?? null)

  const [wmText, setWmText] = useState(text ?? '')
  const [wmFontSize, setWmFontSize] = useState(fontSize ?? 24)
  const [wmColor, setWmColor] = useState(color ?? '#000000')

  const [wmOpacity, setWmOpacity] = useState(opacity ?? 0.2)
  const [wmRotation, setWmRotation] = useState(rotation ?? -45)

  const { mutateAsync: updateWatermark, isPending: updating } = useUpdateTrustCenterWatermarkConfig()
  const { successNotification, errorNotification } = useNotification()

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setUploadedFile(uploaded.file)
    setPreview(URL.createObjectURL(uploaded.file))
  }

  const saveFile = async () => {
    if (!uploadedFile) return

    try {
      await updateWatermark({
        updateTrustCenterWatermarkConfigId: id!,
        input: { clearText: true, clearFont: true, clearColor: true },
        watermarkFile: uploadedFile,
      })

      successNotification({
        title: 'Watermark image updated',
        description: 'Your watermark image has been successfully saved.',
      })
    } catch (err) {
      const message = parseErrorMessage(err)

      errorNotification({
        title: 'Failed to save image',
        description: message,
      })
    }
  }

  const saveTextConfig = async () => {
    try {
      await updateWatermark({
        updateTrustCenterWatermarkConfigId: id!,
        input: {
          text: wmText,
          fontSize: wmFontSize,
          color: wmColor,
          clearFile: true,
        },
      })

      successNotification({
        title: 'Watermark text updated',
        description: 'Text settings have been successfully saved.',
      })
    } catch (err) {
      const message = parseErrorMessage(err)
      errorNotification({
        title: 'Failed to save text watermark',
        description: message,
      })
    }
  }

  const saveVisualConfig = async () => {
    try {
      await updateWatermark({
        updateTrustCenterWatermarkConfigId: id!,
        input: {
          opacity: wmOpacity,
          rotation: wmRotation,
        },
      })

      successNotification({
        title: 'Visual settings updated',
        description: 'Opacity and rotation settings have been saved.',
      })
    } catch (err) {
      const message = parseErrorMessage(err)
      errorNotification({
        title: 'Failed to save visual settings',
        description: message,
      })
    }
  }

  useEffect(() => {
    if (!watermarkConfig) {
      setPreview(null)
      setUploadedFile(null)
      setWmText('')
      setWmFontSize(24)
      setWmColor('#000000')
      setWmOpacity(0.2)
      setWmRotation(-45)
      return
    }

    const { file, text, fontSize, color, opacity, rotation } = watermarkConfig

    setPreview(file?.presignedURL ?? null)
    setWmText(text ?? '')
    setWmFontSize(fontSize ?? 24)
    setWmColor(color ?? '#000000')
    setWmOpacity(opacity ?? 0.2)
    setWmRotation(rotation ?? -45)
  }, [watermarkConfig])

  return (
    <div className="grid grid-cols-[250px_auto] gap-6 items-start mt-12">
      <div className="flex flex-col">
        <div className="flex flex-col">
          <p className="mb-2 font-medium">Image</p>

          <div className="flex-col gap-7 pb-8 border-b">
            <div className="flex gap-7">
              {/* Preview */}
              <div>
                <Label className="mb-2 block text-sm">Preview</Label>
                <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizeUrl(preview)!} alt="Watermark preview" className="max-h-28 object-contain" />
                  ) : (
                    <Eye className="h-6 w-6" />
                  )}
                </div>
              </div>

              {/* Upload block */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="block text-sm">Upload</Label>
                  <SystemTooltip icon={<InfoIcon className="text-brand-100" size={14} />} content={<p>Recommended: PNG, JPG, SVG (max 5 MB)</p>} />
                </div>

                <div className="w-[417px]">
                  <FileUpload
                    acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                    onFileUpload={handleUpload}
                    acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
                    maxFileSizeInMb={5}
                    multipleFiles={false}
                  />
                </div>

                <SaveButton isSaving={updating} onClick={saveFile} disabled={updating || !uploadedFile} className="mt-3 block" />
              </div>
            </div>
          </div>
        </div>

        {/* TEXT */}
        <div className="flex flex-col mt-8">
          <p className="mb-2 font-medium">Text</p>

          <div className="flex gap-7">
            <div className="flex flex-col gap-3 w-[417px]">
              <Label className="text-sm">Text watermark</Label>
              <Input value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="Enter watermark text…" />

              <Label className="text-sm">Font size</Label>
              <Input type="number" value={wmFontSize} onChange={(e) => setWmFontSize(Number(e.target.value))} />

              <ColorInput label="Color" value={wmColor} onChange={setWmColor} />

              <SaveButton isSaving={updating} onClick={saveTextConfig} disabled={updating} className="size-fit mt-3" />
            </div>
          </div>
        </div>

        {/* Visual settings */}
        <div className="flex flex-col mt-8">
          <p className="mb-2 font-medium">Visual Settings (Applied to text and image)</p>

          <div className="flex gap-7">
            <div className="flex flex-col gap-3 w-[417px]">
              <Label className="text-sm">Opacity</Label>
              <Input type="number" step="0.05" min={0} max={1} value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} />

              <Label className="text-sm">Rotation (°)</Label>
              <Input type="number" value={wmRotation} onChange={(e) => setWmRotation(Number(e.target.value))} />

              <SaveButton isSaving={updating} onClick={saveVisualConfig} disabled={updating} className="size-fit mt-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WatermarkConfigurationSection
