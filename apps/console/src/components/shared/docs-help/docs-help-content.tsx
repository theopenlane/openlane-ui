'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ChevronDown, ExternalLink, LoaderCircle, SearchIcon, Sparkles } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Callout } from '@/components/shared/callout/callout'
import { DOCS_URL } from '@/constants/docs'
import { useDocsFullPage, useDocsHelp } from '@/hooks/useDocsHelp'
import { DocsFaqSection, stripFaqSection, useDocsFaq } from './docs-faq'
import { toHumanLabel } from '@/utils/strings'
import type { DocsHelpChunk, DocsSection } from '@/types/docs-help'

const DOCS_HOST = new URL(DOCS_URL).host
const DOCS_SECTION_SEGMENTS = 2
const PLUG_POLL_INTERVAL_MS = 500
const PLUG_POLL_ATTEMPTS = 10

const isPlugWidgetReady = () => typeof window !== 'undefined' && !!window.plugSDK?.__plug_initialized__ && typeof window.plugSDK.toggleWidget === 'function'

const usePlugSupportWidget = () => {
  const [ready, setReady] = useState(isPlugWidgetReady)

  useEffect(() => {
    if (ready) return
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      if (isPlugWidgetReady()) {
        setReady(true)
        clearInterval(timer)
      } else if (attempts >= PLUG_POLL_ATTEMPTS) {
        clearInterval(timer)
      }
    }, PLUG_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [ready])

  const openSupport = useCallback(() => window.plugSDK?.toggleWidget?.(true), [])
  return ready ? openSupport : undefined
}

const docPathOf = (source: string): string | undefined => {
  try {
    return new URL(source).pathname
  } catch {
    return undefined
  }
}

const buildLinkQuery = (text: string, path: string): string => {
  const pathWords = path.split('/').filter(Boolean).slice(DOCS_SECTION_SEGMENTS).join(' ').replace(/[-_]/g, ' ')
  const seen = new Set<string>()
  const words = `${text} ${pathWords}`
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => {
      const key = word.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  return words.join(' ') || path
}

const resolveDocsUrl = (href: string | undefined, base: string): URL | null => {
  try {
    return new URL(href ?? '', base)
  } catch {
    return null
  }
}

export const createDocsMarkdownComponents = (base: string | undefined, onDocLink?: (text: string, path: string) => void): Components => ({
  a: ({ href, children, ...props }) => {
    const resolved = resolveDocsUrl(href, base || DOCS_URL)

    if (resolved && resolved.host === DOCS_HOST && onDocLink) {
      const path = resolved.pathname
      const text = Array.isArray(children) ? children.filter((child) => typeof child === 'string').join('') : typeof children === 'string' ? children : ''
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
})

// Where in the docs a result came from, as a breadcrumb of its parent path
// ("Platform › Standards › SOC 2"). Page titles alone repeat across framework
// pages, so results are indistinguishable without it
export function docsBreadcrumb(source?: string | null): string {
  if (!source) return ''
  try {
    const segments = new URL(source).pathname.split('/').filter(Boolean)
    return segments
      .slice(0, -1)
      .filter((segment) => segment !== 'docs')
      .map(toHumanLabel)
      .join(' › ')
  } catch {
    return ''
  }
}

const withHardBreaks = (text: string): string =>
  text
    .split(/(```[\s\S]*?```)/)
    .map((part) => (part.startsWith('```') ? part : part.replace(/([^\n])\n(?!\n)/g, '$1  \n')))
    .join('')

type DocsHelpContentProps = {
  query: string
  prefer?: string
  intro?: string
  section?: DocsSection
  enabled: boolean
}

type TAskedTopic = { query: string; prefer?: string; fromSearch?: boolean; seed?: DocsHelpChunk[] }

export const DocsHelpContent = ({ query, prefer, intro, section, enabled }: DocsHelpContentProps) => {
  const [followUp, setFollowUp] = useState('')
  const [asked, setAsked] = useState<TAskedTopic | null>(null)

  const activeQuery = asked?.query ?? query
  const activePrefer = asked ? asked.prefer : prefer
  const showIntro = !!intro && !asked

  const { data, isLoading, isFetching, isError } = useDocsHelp({ query: activeQuery, prefer: activePrefer, section, summarize: !showIntro, enabled, seed: asked?.seed })

  const chunks = data?.chunks ?? asked?.seed
  const best = chunks?.[0]
  const summary = data?.summary ?? null
  const summaryPending = summary === null && isFetching
  const showSummaryBox = !showIntro && !!chunks?.length && (summaryPending || !!summary || !!asked)
  const isSearching = isFetching && !!asked?.fromSearch

  const openSupport = usePlugSupportWidget()
  // follows the panel: hopping to another doc page swaps in that page's FAQ
  const faq = useDocsFaq(activeQuery, activePrefer, enabled)
  const hasFaq = !!faq

  // retrieval hands back a fixed-size chunk, so the shown text can stop
  // mid-sentence; the rest of the page loads on demand
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const { data: fullPage, isLoading: fullPageLoading } = useDocsFullPage(activeQuery, expandedSource, enabled, activePrefer)
  const isExpanded = !!best?.source && expandedSource === best.source && !!fullPage

  const handleDocLink = useCallback((text: string, path: string) => {
    setExpandedSource(null)
    setAsked({ query: buildLinkQuery(text, path), prefer: path })
  }, [])

  const selectRelated = useCallback(
    (chunk: DocsHelpChunk) => {
      setExpandedSource(null)
      setAsked({
        query: chunk.title || chunk.source,
        prefer: docPathOf(chunk.source),
        seed: [chunk, ...(chunks ?? []).filter((other) => other.source !== chunk.source)],
      })
    },
    [chunks],
  )

  const submitFollowUp = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = followUp.trim()
    if (!trimmed) return
    setExpandedSource(null)
    setAsked({ query: trimmed, fromSearch: true })
  }

  const backToTopic = () => {
    setAsked(null)
    setFollowUp('')
  }

  const related = useMemo(() => (chunks ?? []).slice(1).filter((chunk) => chunk.source), [chunks])
  const introComponents = useMemo(() => createDocsMarkdownComponents(undefined, handleDocLink), [handleDocLink])
  const bodyComponents = useMemo(() => createDocsMarkdownComponents(best?.source, handleDocLink), [best?.source, handleDocLink])
  const bodyText = useMemo(() => {
    if (!best) return ''
    const text = isExpanded ? fullPage : best.text
    // whenever the FAQ renders as question rows, drop any FAQ section from the
    // body — matching on source is too fragile to rely on
    return withHardBreaks(hasFaq ? stripFaqSection(text) : text)
  }, [best, hasFaq, isExpanded, fullPage])

  return (
    <div className="flex flex-col gap-4 pt-1">
      <form onSubmit={submitFollowUp} className="flex items-center gap-2 pb-4 border-b border-border">
        <div className="flex-1">
          <Input
            maxWidth
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Ask the docs, e.g. how do I link evidence to a control?"
            value={followUp}
            onChange={(e) => setFollowUp(e.currentTarget.value)}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={!followUp.trim()}>
          Search
        </Button>
      </form>

      {showIntro && (
        <Callout variant="success" title={<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About this topic</span>}>
          <div className="prose prose-sm dark:prose-invert max-w-none [&>p:first-of-type]:font-medium">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={introComponents}>
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
          <button type="button" onClick={backToTopic} className="inline-flex shrink-0 items-center gap-1 text-sm text-[var(--color-info)] hover:underline underline-offset-4">
            <ArrowLeft size={12} />
            Back to topic
          </button>
        </div>
      )}
      <div role="status" aria-live="polite" className="flex flex-col gap-4 empty:hidden">
        {isLoading && <p className="text-sm text-muted-foreground">Looking in the docs…</p>}
        {isError && !chunks?.length && <p className="text-sm text-destructive">Couldn&apos;t load help right now.</p>}
        {!isLoading && !isError && chunks?.length === 0 && <p className="text-sm text-muted-foreground">No docs found for this topic.</p>}
      </div>

      {showSummaryBox && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-4" aria-live="polite">
          <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles size={14} />
            AI Summary
          </h4>
          {summaryPending ? (
            <div className="flex flex-col gap-1.5 animate-pulse">
              <span className="sr-only">Generating summary…</span>
              <div aria-hidden className="h-3.5 rounded bg-muted" />
              <div aria-hidden className="h-3.5 rounded bg-muted w-4/5" />
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
          {best.title && (
            <div>
              <p className="text-sm font-medium">{best.title}</p>
              {docsBreadcrumb(best.source) && <p className="text-xs text-muted-foreground">{docsBreadcrumb(best.source)}</p>}
            </div>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={bodyComponents}>
              {bodyText}
            </ReactMarkdown>
          </div>
          {best.truncated && !isExpanded && (
            <button
              type="button"
              disabled={fullPageLoading}
              onClick={() => setExpandedSource(best.source)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ChevronDown size={14} />
              {fullPageLoading ? 'Loading…' : 'Read more'}
            </button>
          )}
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

      {faq && <DocsFaqSection entries={faq.entries} components={createDocsMarkdownComponents(faq.source, handleDocLink)} />}

      {related.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Also relevant</h4>
          <div className="flex flex-col gap-1.5">
            {related.map((chunk) => (
              <button key={chunk.source} type="button" onClick={() => selectRelated(chunk)} className="flex items-baseline gap-1.5 text-left">
                {docsBreadcrumb(chunk.source) && <span className="min-w-0 truncate text-xs text-muted-foreground">{docsBreadcrumb(chunk.source)} ›</span>}
                <span className="shrink-0 text-sm text-[var(--color-info)] hover:underline underline-offset-4">{chunk.title || chunk.source}</span>
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
