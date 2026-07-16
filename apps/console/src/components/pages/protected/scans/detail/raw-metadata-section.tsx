'use client'

import React, { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { CodeBlock } from '@repo/ui/code-block'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'

type Props = {
  metadata: unknown
}

const RawMetadataSection: React.FC<Props> = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const json = useMemo(() => JSON.stringify(metadata, null, 2), [metadata])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <button type="button" onClick={() => setIsExpanded((prev) => !prev)} className="flex-1 text-left">
            <p className="text-lg font-medium leading-7">Raw Metadata</p>
            <p className="text-sm text-muted-foreground">Full scan metadata (JSON)</p>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="text-sm border rounded-md px-3 py-1.5 hover:bg-secondary transition-colors">
                  View full JSON
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Raw Metadata</DialogTitle>
                </DialogHeader>
                <CodeBlock code={json} language="json" showLineNumbers />
              </DialogContent>
            </Dialog>
            <button type="button" onClick={() => setIsExpanded((prev) => !prev)} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="max-h-64 overflow-y-auto">
            <CodeBlock code={json} language="json" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RawMetadataSection
