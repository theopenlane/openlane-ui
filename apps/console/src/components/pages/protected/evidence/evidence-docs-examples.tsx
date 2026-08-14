'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { docsHelpEnabled } from '@repo/dally/ai'
import { ControlControlSource } from '@repo/codegen/src/schema'
import { useControlDocsSection } from '@/components/pages/protected/controls/example-evidence-requests'
import { createDocsMarkdownComponents as docsMarkdownComponents } from '@/components/shared/docs-help/docs-help-content'
import { DocsSourceLink } from '@/components/shared/docs-help/suggestion-card'

export function EvidenceDocsExamples({ control }: { control?: { id: string; refCode: string; referenceFramework?: string | null } }) {
  const [open, setOpen] = useState(false)

  const docsControl = control
    ? {
        controlId: control.id,
        refCode: control.refCode,
        referenceFramework: control.referenceFramework,
        source: control.referenceFramework && control.referenceFramework !== 'CUSTOM' ? ControlControlSource.FRAMEWORK : undefined,
      }
    : undefined

  const examples = useControlDocsSection(docsHelpEnabled ? docsControl : undefined, ['Example Evidence', 'Evidence Requests'])

  if (!docsHelpEnabled || !examples.section || !examples.target) return null
  const { target } = examples

  return (
    <div className="rounded-md border border-border bg-muted/30">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-1 items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="flex items-center gap-2">
          <Lightbulb size={14} className="text-[var(--color-warning)]" />
          <span className="text-sm font-medium">
            Example evidence for {target.framework} {target.refCode}
          </span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3">
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={docsMarkdownComponents(examples.source ?? undefined)}>
              {examples.section}
            </ReactMarkdown>
          </div>
          <div className="mt-2">
            <DocsSourceLink label={`View ${target.refCode} docs`} topic={{ title: `${target.framework} ${target.refCode}`, query: `${target.framework} ${target.refCode}`, prefer: target.refCode }} />
          </div>
        </div>
      )}
    </div>
  )
}
