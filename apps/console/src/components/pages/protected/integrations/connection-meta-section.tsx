'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { type IntegrationMetaEntry } from '@/lib/integrations/types'
import { useNotification } from '@/hooks/useNotification'

type ConnectionMetaSectionProps = {
  meta: Record<string, IntegrationMetaEntry>
}

const ConnectionMetaSection = ({ meta }: ConnectionMetaSectionProps) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { successNotification, errorNotification } = useNotification()

  const entries = Object.entries(meta)

  if (entries.length === 0) {
    return null
  }

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(label)
      setTimeout(() => setCopiedKey(null), 2000)
      successNotification({ title: 'Copied', description: `Openlane ARN copied to clipboard` })
    } catch {
      errorNotification({ title: 'Copy failed', description: 'Clipboard access is not available in this context.' })
    }
  }

  return (
    <div className="mb-4 space-y-2">
      {entries.map(([label, entry]) => (
        <div key={label}>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs break-all">{entry.Value}</code>
            {entry.AllowCopy ? (
              <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(label, entry.Value)} title="Copy to clipboard">
                {copiedKey === label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ConnectionMetaSection
