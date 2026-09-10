'use client'

import React from 'react'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
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
        header={<SlideoutHeader title={`Preview${templateName ? ` — ${templateName}` : ''}`} aboveTitle={<div className="text-sm text-muted-foreground">Email Templates</div>} onClose={onClose} />}
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
