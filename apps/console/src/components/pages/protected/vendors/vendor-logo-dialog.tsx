'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Check, Loader2 } from 'lucide-react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { useSuggestedVendorLogos } from './hooks/use-suggested-vendor-logos'

interface VendorLogoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  vendorDisplayName?: string
  domains?: string[]
  onLogoSelect: (file: File) => Promise<void>
  isLoading?: boolean
}

export const fetchLogoAsFile = async (logoUrl: string): Promise<File> => {
  if (logoUrl.startsWith('data:')) {
    const [header, data] = logoUrl.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    const binaryString = atob(data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const extension = mimeType.includes('png') ? '.png' : mimeType.includes('svg') ? '.svg' : '.jpg'
    return new File([bytes], `logo${extension}`, { type: mimeType })
  }
  const response = await fetch(logoUrl)
  if (!response.ok) throw new Error('Failed to fetch logo')
  const blob = await response.blob()
  const extension = blob.type.includes('png') ? '.png' : blob.type.includes('svg') ? '.svg' : '.jpg'
  return new File([blob], `logo${extension}`, { type: blob.type })
}

export const VendorLogoDialog: React.FC<VendorLogoDialogProps> = ({ open, onOpenChange, vendorName, vendorDisplayName, domains, onLogoSelect, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [selectedSuggestionUrl, setSelectedSuggestionUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { errorNotification } = useNotification()

  const suggestedLogos = useSuggestedVendorLogos({ vendorName, vendorDisplayName, domains, enabled: open })

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreview(null)
      setSelectedSuggestionId(null)
      setSelectedSuggestionUrl(null)
    }
  }, [open])

  const handleFileUpload = (uploaded: TUploadedFile) => {
    setSelectedFile(uploaded.file ?? null)
    setPreview(uploaded.url ?? null)
    setSelectedSuggestionId(null)
    setSelectedSuggestionUrl(null)
  }

  const handleSuggestionSelect = (logo: { id: string; logoUrl: string }) => {
    setSelectedSuggestionId(logo.id)
    setSelectedSuggestionUrl(logo.logoUrl)
    setPreview(logo.logoUrl)
    setSelectedFile(null)
  }

  const hasSelection = selectedFile !== null || selectedSuggestionId !== null

  const handleSave = async () => {
    setSaving(true)
    try {
      let file = selectedFile
      if (!file && selectedSuggestionUrl) {
        try {
          file = await fetchLogoAsFile(selectedSuggestionUrl)
        } catch {
          errorNotification({ title: 'Failed to add logo', description: 'The selected logo could not be loaded. Please try another logo or upload a file.' })
          return
        }
      }
      if (file) {
        await onLogoSelect(file)
        onOpenChange(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const isBusy = isLoading || saving

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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!hasSelection || isBusy}>
            {isBusy ? (
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
