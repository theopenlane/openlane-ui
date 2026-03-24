'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, Loader2 } from 'lucide-react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { fetchLogoAsFile } from '../../vendor-logo-dialog'
import { cn } from '@repo/ui/lib/utils'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

interface StepVendorLogoProps {
  onLogoFileChange: (file: File | null) => void
}

const StepVendorLogo: React.FC<StepVendorLogoProps> = ({ onLogoFileChange }) => {
  const form = useFormContext<EditVendorFormData>()
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedSubprocessorId, setSelectedSubprocessorId] = useState<string | null>(null)
  const [autoSelecting, setAutoSelecting] = useState(false)
  const hasAutoSelectedRef = useRef(false)

  const vendorName = form.watch('name') ?? ''
  const vendorDisplayName = form.watch('displayName')

  const searchTerms = useMemo(() => {
    const terms = [vendorName]
    if (vendorDisplayName && vendorDisplayName.toLowerCase() !== vendorName.toLowerCase()) {
      terms.push(vendorDisplayName)
    }
    return terms
  }, [vendorName, vendorDisplayName])

  const { subprocessors: nameResults } = useGetSubprocessors({
    where: { nameContainsFold: searchTerms[0] },
    enabled: !!searchTerms[0],
  })

  const { subprocessors: displayNameResults } = useGetSubprocessors({
    where: searchTerms[1] ? { nameContainsFold: searchTerms[1] } : undefined,
    enabled: !!searchTerms[1],
  })

  const suggestedLogos = useMemo(() => {
    const seen = new Set<string>()
    const results: Array<{ id: string; name: string; logoUrl: string }> = []

    for (const sp of [...(nameResults ?? []), ...(displayNameResults ?? [])]) {
      if (!sp || seen.has(sp.id)) continue
      const logoUrl = sp.logoFile?.presignedURL || sp.logoRemoteURL
      if (!logoUrl) continue
      seen.add(sp.id)
      results.push({ id: sp.id, name: sp.name, logoUrl })
    }

    return results
  }, [nameResults, displayNameResults])

  // Auto-select first matching logo
  useEffect(() => {
    if (hasAutoSelectedRef.current || suggestedLogos.length === 0) return
    hasAutoSelectedRef.current = true

    const first = suggestedLogos[0]
    setSelectedSubprocessorId(first.id)
    setPreview(first.logoUrl)
    setAutoSelecting(true)

    fetchLogoAsFile(first.logoUrl)
      .then((file) => {
        onLogoFileChange(file)
      })
      .catch(() => {
        // If fetch fails, just show the preview - user can still upload manually
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
      setSelectedSubprocessorId(null)
    }
  }

  const handleSubprocessorSelect = async (logo: { id: string; logoUrl: string }) => {
    setSelectedSubprocessorId(logo.id)
    setPreview(logo.logoUrl)
    setAutoSelecting(true)

    try {
      const file = await fetchLogoAsFile(logo.logoUrl)
      onLogoFileChange(file)
    } catch {
      // Keep selection visible even if fetch fails
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
                onClick={() => handleSubprocessorSelect(logo)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-all bg-transparent hover:bg-muted/50',
                  selectedSubprocessorId === logo.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                )}
              >
                {selectedSubprocessorId === logo.id && (
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
