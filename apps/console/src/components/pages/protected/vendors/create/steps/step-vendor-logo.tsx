'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, Loader2 } from 'lucide-react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { fetchLogoAsFile } from '../../vendor-logo-dialog'
import { cn } from '@repo/ui/lib/utils'
import { useSuggestedVendorLogos } from '../../hooks/use-suggested-vendor-logos'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

interface StepVendorLogoProps {
  onLogoFileChange: (file: File | null) => void
}

const StepVendorLogo: React.FC<StepVendorLogoProps> = ({ onLogoFileChange }) => {
  const form = useFormContext<EditVendorFormData>()
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [autoSelecting, setAutoSelecting] = useState(false)
  const hasAutoSelectedRef = useRef(false)

  const vendorName = form.watch('name') ?? ''
  const vendorDisplayName = form.watch('displayName')
  const domains = form.watch('domains')

  const suggestedLogos = useSuggestedVendorLogos({ vendorName, vendorDisplayName, domains })

  useEffect(() => {
    if (hasAutoSelectedRef.current) return
    const first = suggestedLogos.find((logo) => logo.source === 'subprocessor')
    if (!first) return
    hasAutoSelectedRef.current = true

    setSelectedSuggestionId(first.id)
    setPreview(first.logoUrl)
    setAutoSelecting(true)

    fetchLogoAsFile(first.logoUrl)
      .then((file) => {
        onLogoFileChange(file)
      })
      .catch(() => {
        setSelectedSuggestionId(null)
        setPreview(null)
      })
      .finally(() => {
        setAutoSelecting(false)
      })
  }, [suggestedLogos, onLogoFileChange])

  const handleFileUpload = (uploaded: TUploadedFile) => {
    const file = uploaded.file ?? null
    if (file) {
      onLogoFileChange(file)
      setPreview(uploaded.url ?? null)
      setSelectedSuggestionId(null)
    }
  }

  const handleSuggestionSelect = async (logo: { id: string; logoUrl: string }) => {
    setSelectedSuggestionId(logo.id)
    setPreview(logo.logoUrl)
    setAutoSelecting(true)

    try {
      const file = await fetchLogoAsFile(logo.logoUrl)
      onLogoFileChange(file)
    } catch {
      setSelectedSuggestionId(null)
      setPreview(null)
      onLogoFileChange(null)
    } finally {
      setAutoSelecting(false)
    }
  }

  return (
    <div className="space-y-5">
      {preview && (
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-background overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo preview" className="max-h-full max-w-full object-contain p-1" />
          </div>
          {autoSelecting && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
        </div>
      )}

      {suggestedLogos.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Suggested Logos</p>
          <div className="grid grid-cols-4 gap-3">
            {suggestedLogos.map((logo) => (
              <button
                key={logo.id}
                type="button"
                onClick={() => handleSuggestionSelect(logo)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-all bg-transparent hover:bg-muted/50',
                  selectedSuggestionId === logo.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                )}
              >
                {selectedSuggestionId === logo.id && (
                  <div className="absolute top-1 right-1">
                    <Check size={14} className="text-primary" />
                  </div>
                )}
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.logoUrl} alt={logo.name} className="max-h-full max-w-full object-contain" />
                </div>
                <span className="text-xs text-muted-foreground truncate w-full text-center">{logo.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">Upload Logo</p>
        <FileUpload
          onFileUpload={handleFileUpload}
          acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
          acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
          maxFileSizeInMb={5}
          multipleFiles={false}
        />
      </div>
    </div>
  )
}

export default StepVendorLogo
