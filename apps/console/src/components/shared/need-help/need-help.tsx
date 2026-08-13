'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ExternalLink, HelpCircle, SearchIcon, Sparkles } from 'lucide-react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { docsHelpEnabled } from '@repo/dally/ai'
import { Callout } from '@/components/shared/callout/callout'
import { DOCS_URL } from '@/constants/docs'
import type { Components } from 'react-markdown'
import { useDocsHelp, useDocsSummary, type DocsSection } from '@/hooks/useDocsHelp'

type NeedHelpProps = {
  // What to look up in the docs
  query: string
  // Rank doc pages whose title/source match this first
  prefer?: string
  // Panel title of slideout
  title: string
  subtitle?: string
  className?: string
  // Optional escalation, e.g. open the DevRev PLuG widget
  onNeedMoreHelp?: () => void
  // Custom trigger, e.g. an inline "learn more" link; defaults to a "Need help?" button
  trigger?: (open: () => void) => ReactNode
  // Docs page to open (new tab) when docs help is disabled for the deployment
  fallbackHref?: string
}

export function NeedHelp({ query, prefer, title, subtitle, className, onNeedMoreHelp, trigger, fallbackHref }: NeedHelpProps) {
  const [open, setOpen] = useState(false)

  // hide the trigger entirely unless the deployment opts in
  if (!docsHelpEnabled) {
    if (!fallbackHref) return null
    const openDocs = () => window.open(fallbackHref, '_blank', 'noopener,noreferrer')
    return trigger ? (
      <>{trigger(openDocs)}</>
    ) : (
      <Button type="button" variant="secondary" icon={<HelpCircle />} className={className} onClick={openDocs}>
        Need help?
      </Button>
    )
  }

  return (
    <InfoSlideOut
      title={title}
      subtitle={subtitle}
      open={open}
      onOpenChange={setOpen}
      width={660}
      resizable
      icon={<HelpCircle size={20} />}
      trigger={
        trigger ??
        ((openPanel) => (
          <Button
            type="button"
            variant="secondary"
            icon={<HelpCircle />}
            className={className}
            onClick={(e) => {
              e.stopPropagation()
              openPanel()
            }}
          >
            Need help?
          </Button>
        ))
      }
    >
      <DocsHelpContent query={query} prefer={prefer} enabled={open} onNeedMoreHelp={onNeedMoreHelp} closePanel={() => setOpen(false)} />
    </InfoSlideOut>
  )
}
function docsMarkdownComponents(base?: string, onDocLink?: (text: string, path: string) => void): Components {
  return {
    a: ({ href, children, ...props }) => {
      let resolved: URL | null = null
      try {
        resolved = new URL(href ?? '', base || DOCS_URL)
      } catch {
        // leave unresolvable hrefs as-is
      }
      const docsHost = new URL(DOCS_URL).host
      if (resolved && onDocLink && resolved.host === docsHost) {
        const path = resolved.pathname
        const text = Array.isArray(children) ? children.filter((c) => typeof c === 'string').join('') : typeof children === 'string' ? children : ''
        return (
          <a
            {...props}
            href={resolved.toString()}
            onClick={(e) => {
              e.preventDefault()
              onDocLink(text || path, path)
            }}
          >
            {children}
          </a>
        )
      }
      return (
        <a {...props} href={resolved?.toString() ?? href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
  }
}

function withHardBreaks(text: string): string {
  return text
    .split(/(```[\s\S]*?```)/)
    .map((part) => (part.startsWith('```') ? part : part.replace(/([^\n])\n(?!\n)/g, '$1  \n')))
    .join('')
}

export function DocsHelpContent({
  query,
  prefer,
  intro,
  section,
  enabled,
  onNeedMoreHelp,
  closePanel,
}: {
  query: string
  prefer?: string
  intro?: string
  section?: DocsSection
  enabled: boolean
  onNeedMoreHelp?: () => void
  /** closes the containing slideout — the modal sheet blocks interaction with the chat widget, so escalation closes it first */
  closePanel?: () => void
}) {
  // default escalation: open the DevRev PLuG chat widget when it's running;
  // an explicit onNeedMoreHelp prop overrides this
  const plugReady = typeof window !== 'undefined' && !!window.plugSDK?.__plug_initialized__ && typeof window.plugSDK.toggleWidget === 'function'
  const escalate = onNeedMoreHelp ?? (plugReady ? () => window.plugSDK?.toggleWidget?.(true) : undefined)
  const openSupport = escalate
    ? () => {
        closePanel?.()
        // let the sheet dismiss (and release its pointer-event lock) first
        setTimeout(escalate, 0)
      }
    : undefined
  const [followUp, setFollowUp] = useState('')
  // when set, the user asked their own question or clicked an inline doc link —
  // retrieve on that instead of the page topic. Doc-link hops carry their own
  // prefer (the target page path) so that page ranks first
  const [asked, setAsked] = useState<{ query: string; prefer?: string } | null>(null)
  const activeQuery = asked?.query ?? query
  const { data: chunks, isLoading, isError } = useDocsHelp(activeQuery, enabled, asked ? asked.prefer : prefer, section)

  const [selected, setSelected] = useState(0)
  const bestIndex = chunks?.[selected] ? selected : 0
  const best = chunks?.[bestIndex]

  // when the user picks an "Also relevant" section, summarize THAT page —
  // query on its title, pinned to its URL — instead of the original topic
  const viewingRelated = bestIndex !== 0 && !!best
  let summaryQuery = activeQuery
  let summaryPrefer = asked ? asked.prefer : prefer
  if (viewingRelated && best) {
    summaryQuery = best.title || activeQuery
    try {
      summaryPrefer = best.source ? new URL(best.source).pathname : undefined
    } catch {
      summaryPrefer = undefined
    }
  }

  // a curated intro replaces the AI summary, but only while the panel still
  // shows the page topic itself
  const showIntro = !!intro && !asked && !viewingRelated
  const { data: summary, isLoading: summaryLoading } = useDocsSummary(summaryQuery, enabled && !showIntro, summaryPrefer, section)
  // while a follow-up question is in flight keep the summary box up with its
  // skeleton the whole time
  const summaryPending = summaryLoading || isLoading
  const showSummaryBox = !showIntro && (summaryPending || !!summary || !!asked || viewingRelated)

  const submitFollowUp = (e: FormEvent) => {
    e.preventDefault()
    const q = followUp.trim()
    if (q) {
      setAsked({ query: q })
      setSelected(0)
    }
  }

  // inline doc-link hop: look up the linked page in-panel
  const handleDocLink = (text: string, path: string) => {
    const pathWords = path
      .split('/')
      .filter(Boolean)
      .slice(2) // drop the /docs/<section>/ prefix
      .join(' ')
      .replace(/[-_]/g, ' ')
    const seen = new Set<string>()
    const queryWords = `${text} ${pathWords}`
      .split(/\s+/)
      .filter(Boolean)
      .filter((w) => {
        const k = w.toLowerCase()
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
    setAsked({ query: queryWords.join(' ') || path, prefer: path })
    setSelected(0)
  }

  const related = (chunks ?? []).map((c, i) => ({ c, i })).filter(({ c, i }) => i !== bestIndex && c.source)

  return (
    <div className="flex flex-col gap-4 pt-1">
      <form onSubmit={submitFollowUp} className="flex items-center gap-2 pb-4 border-b border-border">
        <div className="flex-1">
          <Input maxWidth icon={<SearchIcon size={16} />} placeholder="Ask the docs, e.g. how do I link evidence to a control?" value={followUp} onChange={(e) => setFollowUp(e.currentTarget.value)} />
        </div>
        <Button type="submit" variant="secondary" disabled={!followUp.trim()}>
          Search
        </Button>
      </form>

      {showIntro && (
        <Callout variant="success" title={<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About this topic</span>}>
          <div className="prose prose-sm dark:prose-invert max-w-none [&>p:first-of-type]:font-medium">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={docsMarkdownComponents(undefined, handleDocLink)}>
              {intro}
            </ReactMarkdown>
          </div>
        </Callout>
      )}

      {asked && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground truncate">
            Results for “<span className="text-foreground">{asked.query}</span>”
          </p>
          <button
            type="button"
            onClick={() => {
              setAsked(null)
              setFollowUp('')
              setSelected(0)
            }}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-[var(--color-info)] hover:underline underline-offset-4"
          >
            <ArrowLeft size={12} />
            Back to topic
          </button>
        </div>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Looking in the docs…</p>}
      {isError && <p className="text-sm text-destructive">Couldn&apos;t load help right now.</p>}
      {!isLoading && !isError && chunks?.length === 0 && <p className="text-sm text-muted-foreground">No docs found for this topic.</p>}

      {showSummaryBox && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-4">
          <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles size={14} />
            AI Summary
          </h4>
          {summaryPending ? (
            <div className="flex flex-col gap-1.5 animate-pulse" aria-label="Generating summary">
              <div className="h-3.5 rounded bg-muted" />
              <div className="h-3.5 rounded bg-muted w-4/5" />
            </div>
          ) : summary ? (
            <>
              <p className="text-sm">{summary}</p>
              <p className="text-xs text-muted-foreground">AI-generated summary. The documentation below is the source of truth.</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No summary available for this question — the documentation below is the best match.</p>
          )}
        </div>
      )}

      {best && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">From the docs</h4>
          {best.title && <p className="text-sm font-medium">{best.title}</p>}
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={docsMarkdownComponents(best.source, handleDocLink)}>
              {withHardBreaks(best.text)}
            </ReactMarkdown>
          </div>
          {best.source && (
            <a
              href={best.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-info)] hover:underline underline-offset-4"
            >
              View documentation
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {related.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Also relevant</h4>
          <div className="flex flex-col gap-1.5">
            {related.map(({ c, i }) => (
              <button key={i} type="button" onClick={() => setSelected(i)} className="self-start text-left text-sm text-[var(--color-info)] hover:underline underline-offset-4">
                {c.title || c.source}
              </button>
            ))}
          </div>
        </div>
      )}

      {openSupport && (
        <div className="pt-4 border-t border-border">
          <p className="mb-3 text-xs text-muted-foreground">Docs didn&apos;t answer it? Our team can help.</p>
          <Button type="button" variant="secondary" onClick={openSupport}>
            Chat with support
          </Button>
        </div>
      )}
    </div>
  )
}
