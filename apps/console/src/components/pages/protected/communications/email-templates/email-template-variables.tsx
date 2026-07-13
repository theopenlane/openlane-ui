'use client'

import React from 'react'
import { Copy } from 'lucide-react'
import type { EmailTemplateCatalogEntryNode } from '@/lib/graphql-hooks/email-template'

interface EmailTemplateVariablesProps {
  variables: EmailTemplateCatalogEntryNode['variables']
  onCopy: (name: string) => void
}

export const EmailTemplateVariables: React.FC<EmailTemplateVariablesProps> = ({ variables, onCopy }) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs text-muted-foreground">Available template variables. Click to copy a token, then paste it into any field above.</p>
    <div className="flex flex-col divide-y divide-border">
      {variables.map((variable) => (
        <div key={variable.name} className="flex items-start justify-between gap-3 py-2">
          <div className="flex flex-col gap-0.5">
            <code className="text-xs font-mono text-foreground">{`{{ .${variable.name} }}`}</code>
            {variable.description && <span className="text-xs text-muted-foreground">{variable.description}</span>}
          </div>
          <button
            type="button"
            onClick={() => onCopy(variable.name)}
            className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            <Copy size={12} />
            Copy
          </button>
        </div>
      ))}
    </div>
  </div>
)
