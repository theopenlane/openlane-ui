'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Palette } from 'lucide-react'
import { useGetTemplate } from '@/lib/graphql-hooks/template'
import { Badge } from '@repo/ui/badge'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface PreviewStepProps {
  form: UseFormReturn<CampaignFormData>
  onOpenEmailBranding: () => void
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ form, onOpenEmailBranding }) => {
  const templateId = form.watch('templateID')
  const { data: templateData } = useGetTemplate(templateId ?? undefined)

  const template = templateData?.template
  const config = template?.jsonconfig as Record<string, unknown> | undefined
  const subject = (config?.subject as string) ?? ''
  const body = (config?.body as string) ?? ''
  const tokens = (config?.tokens as string[]) ?? []

  return (
    <div className="flex flex-col gap-4">
      {templateId ? (
        <div className="text-sm">
          Selected template: <span className="font-medium">{template?.name ?? templateId}</span>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No template selected. Go back to Step 1 to choose one.</div>
      )}

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Customise email style</span>
        <Button variant="primary" icon={<Palette size={16} />} iconPosition="left" onClick={onOpenEmailBranding} type="button">
          Email Branding
        </Button>
      </div>

      {templateId && (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h4 className="text-sm font-semibold">Campaign Preview</h4>
            <p className="text-xs text-muted-foreground">This is how your email will appear to recipients</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <span className="text-sm font-medium text-muted-foreground min-w-[60px]">Subject:</span>
              <span className="text-sm">{subject || 'No subject configured'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm font-medium text-muted-foreground min-w-[60px]">Body:</span>
              <div className="text-sm whitespace-pre-wrap">{body || 'No body configured'}</div>
            </div>
            {tokens.length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="text-sm font-medium text-muted-foreground min-w-[60px]">Tokens:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tokens.map((token) => (
                    <Badge key={token} variant="outline" className="text-xs">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
