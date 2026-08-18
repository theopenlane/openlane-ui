'use client'

// Shared chrome for the docs-driven suggestion surfaces: a collapsible card,
// the rows inside it, the "from the docs" attribution and the dismiss control
import { useState, type ReactNode } from 'react'
import { BookText, ChevronDown, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@repo/ui/cardpanel'
import { Checkbox } from '@repo/ui/checkbox'
import { createDocsMarkdownComponents } from '@/components/shared/docs-help/docs-help-content'
import { SystemTooltip } from '@repo/ui/system-tooltip'
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

// A slice of documentation markdown, rendered the way the docs panel renders it
export function DocsMarkdown({ section, source, className }: { section: string; source?: string; className?: string }) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={createDocsMarkdownComponents(source)}>
        {section}
      </ReactMarkdown>
    </div>
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
export function DismissButton({ onClick, label, tooltip = 'Dismiss All Suggestions' }: { onClick: () => void; label: string; tooltip?: string }) {
  return (
    <SystemTooltip
      content={tooltip}
      icon={
        <button type="button" onClick={onClick} aria-label={label} className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:text-foreground">
          <X size={14} />
        </button>
      }
    />
  )
}

type TChecklistTarget = { id: string; refCode: string; referenceFramework?: string | null }

export function TargetChecklist<T extends TChecklistTarget>({ targets, isSelected, onToggle }: { targets: T[]; isSelected: (target: T) => boolean; onToggle: (target: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-1">
      <span className="text-xs text-muted-foreground">Maps to:</span>
      {targets.map((target) => (
        <label key={target.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox checked={isSelected(target)} onCheckedChange={() => onToggle(target)} />
          <DocsSourceLink
            label={target.refCode}
            topic={{ title: [target.referenceFramework, target.refCode].filter(Boolean).join(' '), query: `${target.referenceFramework ?? ''} ${target.refCode}`.trim(), prefer: target.refCode }}
            size={11}
          />
        </label>
      ))}
    </div>
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // rendered to the right of the header, outside the expand target
  actions?: ReactNode
  // shown above the children when expanded
  intro?: ReactNode
  className?: string
  children: ReactNode
}

// Collapsible card used by every docs-sourced suggestion. The whole header row
// toggles, up to the actions, so the click target is not just the chevron
export function SuggestionCard({ title, icon, count, defaultOpen = true, open: controlledOpen, onOpenChange, actions, intro, className, children }: SuggestionCardProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultOpen)
  const expanded = controlledOpen ?? uncontrolledExpanded
  const setExpanded = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledExpanded(next)
    onOpenChange?.(next)
  }

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
