'use client'

import React from 'react'
import { TriangleAlert } from 'lucide-react'
import type { EmailTemplateCatalogEntryNode } from '@/lib/graphql-hooks/email-template'
import { EmailTemplateConfigForm } from './email-template-config-form'

interface EmailTemplateConfigurationProps {
  isCatalogLoading: boolean
  isCatalogDrift: boolean
  selectedKey: string
  selectedEntry?: EmailTemplateCatalogEntryNode
  configData: Record<string, unknown>
  onConfigChange: (data: Record<string, unknown>) => void
  readOnly: boolean
}

export const EmailTemplateConfiguration: React.FC<EmailTemplateConfigurationProps> = ({ isCatalogLoading, isCatalogDrift, selectedKey, selectedEntry, configData, onConfigChange, readOnly }) => {
  if (isCatalogLoading) {
    return <p className="text-sm text-muted-foreground">Loading configuration...</p>
  }

  if (isCatalogDrift) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <TriangleAlert size={16} className="shrink-0 text-yellow-500" />
          <span>
            This template uses the catalog key <span className="font-mono">{selectedKey}</span>, which is no longer available. Showing its saved configuration as read-only JSON.
          </span>
        </div>
        <pre className="overflow-auto rounded-md border border-border bg-card p-3 text-xs">{JSON.stringify(configData, null, 2)}</pre>
      </div>
    )
  }

  if (!selectedEntry) {
    return <p className="text-sm text-muted-foreground">Select a template to configure its fields.</p>
  }

  return <EmailTemplateConfigForm schema={selectedEntry.configSchema} uiSchema={selectedEntry.uiSchema} formData={configData} onChange={onConfigChange} readOnly={readOnly} />
}
