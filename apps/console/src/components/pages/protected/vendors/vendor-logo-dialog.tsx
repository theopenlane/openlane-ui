'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Check, Loader2 } from 'lucide-react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { cn } from '@repo/ui/lib/utils'

export type LogoSelection = { type: 'file'; file: File } | { type: 'fileId'; fileId: string; previewUrl: string }

interface VendorLogoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  vendorDisplayName?: string
  onLogoSelect: (selection: LogoSelection) => Promise<void>
  isLoading?: boolean
}

export const VendorLogoDialog: React.FC<VendorLogoDialogProps> = ({ open, onOpenChange, vendorName, vendorDisplayName, onLogoSelect, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedSubprocessor, setSelectedSubprocessor] = useState<{ id: string; fileId: string; logoUrl: string } | null>(null)

  const searchTerms = useMemo(() => {
    const terms = [vendorName]
    if (vendorDisplayName && vendorDisplayName.toLowerCase() !== vendorName.toLowerCase()) {
      terms.push(vendorDisplayName)
    }
    return terms
  }, [vendorName, vendorDisplayName])

  const { subprocessors: nameResults } = useGetSubprocessors({
    where: { nameContainsFold: searchTerms[0] },
    enabled: open && !!searchTerms[0],
  })

  const { subprocessors: displayNameResults } = useGetSubprocessors({
    where: searchTerms[1] ? { nameContainsFold: searchTerms[1] } : undefined,
    enabled: open && !!searchTerms[1],
  })

  const suggestedLogos = useMemo(() => {
    const seen = new Set<string>()
    const results: Array<{ id: string; name: string; logoUrl: string; fileId: string | null }> = []

    for (const sp of [...(nameResults ?? []), ...(displayNameResults ?? [])]) {
      if (!sp || seen.has(sp.id)) continue
      const logoUrl = sp.logoFile?.presignedURL || sp.logoRemoteURL
      if (!logoUrl) continue
      seen.add(sp.id)
      results.push({ id: sp.id, name: sp.name, logoUrl, fileId: sp.logoFile?.id ?? null })
    }

    return results
  }, [nameResults, displayNameResults])

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreview(null)
      setSelectedSubprocessor(null)
    }
  }, [open])

  const handleFileUpload = (uploaded: TUploadedFile) => {
    setSelectedFile(uploaded.file ?? null)
    setPreview(uploaded.url ?? null)
    setSelectedSubprocessor(null)
  }

  const handleSubprocessorSelect = (logo: { id: string; name: string; logoUrl: string; fileId: string | null }) => {
    if (!logo.fileId) return
    setSelectedSubprocessor({ id: logo.id, fileId: logo.fileId, logoUrl: logo.logoUrl })
    setPreview(logo.logoUrl)
    setSelectedFile(null)
  }

  const hasSelection = selectedFile !== null || selectedSubprocessor !== null

  const handleSave = async () => {
    if (selectedFile) {
      await onLogoSelect({ type: 'file', file: selectedFile })
    } else if (selectedSubprocessor) {
      await onLogoSelect({ type: 'fileId', fileId: selectedSubprocessor.fileId, previewUrl: selectedSubprocessor.logoUrl })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Logo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {preview && (
            <div className="flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-background overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Logo preview" className="max-h-full max-w-full object-contain p-1" />
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

          {suggestedLogos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Suggested Logos</p>
              <div className="grid grid-cols-4 gap-3">
                {suggestedLogos.map((logo) => (
                  <button
                    key={logo.id}
                    type="button"
                    disabled={!logo.fileId}
                    onClick={() => handleSubprocessorSelect(logo)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-all bg-transparent hover:bg-muted/50',
                      selectedSubprocessor?.id === logo.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                    )}
                  >
                    {selectedSubprocessor?.id === logo.id && (
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!hasSelection || isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
