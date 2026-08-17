'use client'

// Shared chrome for the docs-driven suggestion surfaces: a collapsible card,
// the rows inside it, the "from the docs" attribution and the dismiss control
import { useState, type ReactNode } from 'react'
import { BookText, ChevronDown, X } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { useDocsHelpDrawer, useDocsHelpNavigate, type DocsHelpTopic } from '@/components/shared/docs-help/docs-help-context'

// Link back to the doc a suggestion came from, opening it in the drawer
export function DocsSourceLink({ label, topic, size = 12 }: { label: string; topic?: DocsHelpTopic; size?: number }) {
  const navigateDocs = useDocsHelpNavigate()
  const { setOpen } = useDocsHelpDrawer()

  return (
    <button
      type="button"
      onClick={() => (topic ? navigateDocs(topic) : setOpen(true))}
      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4"
    >
      {label}
      <BookText size={size} />
    </button>
  )
}

// Reminder that doc examples are not a substitute for the auditor's own ask
export function EvidenceExamplesDisclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs italic text-muted-foreground">
      <span>These are examples only. Reach out to your auditor if you have specific questions on what evidence you need to supply.</span>
      {children}
    </p>
  )
}

// Wave a suggestion away without acting on it
export function DismissButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:text-foreground">
      <X size={14} />
    </button>
  )
}

// One suggestion: what it is on the left, what you can do about it on the right
export function SuggestionRow({ title, description, note, action }: { title: ReactNode; description?: ReactNode; note?: ReactNode; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {note && <span className="text-xs text-muted-foreground">{note}</span>}
        </div>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type SuggestionCardProps = {
  title: string
  // leading icon, e.g. a lightbulb for suggestions
  icon?: ReactNode
  // shown beside the title when there is more than one suggestion
  count?: number
  // start collapsed when the content is supplementary
  defaultOpen?: boolean
  // rendered to the right of the header, outside the expand target
  actions?: ReactNode
  // shown above the children when expanded
  intro?: ReactNode
  className?: string
  children: ReactNode
}

// Collapsible card used by every docs-sourced suggestion. The whole header row
// toggles, up to the actions, so the click target is not just the chevron
export function SuggestionCard({ title, icon, count, defaultOpen = true, actions, intro, className, children }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(defaultOpen)

  return (
    <Card className={`p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown size={14} className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {icon}
          <h3 className="text-base font-semibold">{title}</h3>
          {count !== undefined && count > 0 && <CountBadge count={count} />}
        </button>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {expanded && (
        <>
          {intro && <p className="mt-2 mb-3 text-sm text-muted-foreground">{intro}</p>}
          {children}
        </>
      )}
    </Card>
  )
}
