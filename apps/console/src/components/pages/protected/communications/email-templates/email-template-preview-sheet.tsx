'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { X } from 'lucide-react'
import { usePreviewEmailTemplateHtml } from '@/lib/graphql-hooks/email-template'
import { EmailTemplatePreview } from './email-template-preview'

interface EmailTemplatePreviewSheetProps {
  open: boolean
  templateKey?: string
  templateName?: string
  fallbackHtml?: string
  defaults: Record<string, unknown>
  onClose: () => void
}

export const EmailTemplatePreviewSheet: React.FC<EmailTemplatePreviewSheetProps> = ({ open, templateKey, templateName, fallbackHtml, defaults, onClose }) => {
  const { previewHtml, isFetching, errorMessage } = usePreviewEmailTemplateHtml({
    key: templateKey,
    defaults,
    fallbackHtml,
    enabled: open && !!templateKey,
  })

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="40vw"
        initialWidth="50vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">Preview Email Template</SheetTitle>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground">
                Email Templates / <span className="font-semibold text-foreground">Preview{templateName ? ` — ${templateName}` : ''}</span>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <button type="button" onClick={onClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        {open && (
          <div className="mt-2">
            <EmailTemplatePreview previewHtml={previewHtml} isFetching={isFetching} errorMessage={errorMessage} isCatalogDrift={false} selectedKey={templateKey ?? ''} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
