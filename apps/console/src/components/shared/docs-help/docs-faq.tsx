'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown } from 'lucide-react'
import { docsHelpAvailable } from '@repo/dally/ai'
import { useDocsSection } from '@/hooks/useDocsHelp'
import type { Components } from 'react-markdown'

// doc pages spell this heading a few different ways
const FAQ_HEADINGS = ['Frequently Asked Questions', 'FAQs', 'FAQ']

export type FaqEntry = { question: string; answer: string }

// Remove the FAQ section from page text, for when it is being rendered
// separately as question rows — otherwise the reader sees it twice
export function stripFaqSection(markdown: string): string {
  const names = FAQ_HEADINGS.map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  // tolerate anchors or trailing words on the heading ("## FAQ {#faq}")
  const start = new RegExp(`^(#+)\\s*(?:${names})\\b.*$`, 'im').exec(markdown)
  if (!start) return markdown

  const level = start[1].length
  const body = markdown.slice(start.index + start[0].length)
  // stop at the next heading of the same or higher level
  const next = new RegExp(`^#{1,${level}}\\s`, 'm').exec(body)
  return (markdown.slice(0, start.index) + (next ? body.slice(next.index) : '')).trim()
}

// FAQ sections are written as a question paragraph followed by its answer,
// with no markup separating them — so pair them up on the question mark
export function parseFaq(markdown: string): FaqEntry[] {
  const blocks = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const entries: FaqEntry[] = []
  for (const block of blocks) {
    const isQuestion = block.endsWith('?') && block.length < 200 && !block.startsWith('-') && !block.startsWith('*')
    if (isQuestion) {
      entries.push({ question: block.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, ''), answer: '' })
      continue
    }
    const current = entries[entries.length - 1]
    if (current) current.answer = current.answer ? `${current.answer}\n\n${block}` : block
  }
  return entries.filter((entry) => entry.answer)
}

// The FAQ for a docs topic. FAQs are written per object ("controls",
// "policies"), not per record, so this takes the page's docs topic
export function useDocsFaq(query: string, prefer?: string, enabled = true) {
  const { data } = useDocsSection(query, FAQ_HEADINGS, docsHelpAvailable && enabled, prefer)
  if (!data?.section) return null
  const entries = parseFaq(data.section)
  return entries.length ? { entries, source: data.source } : null
}

// One question per row, answers revealed on demand
export function DocsFaqSection({ entries, components }: { entries: FaqEntry[]; components?: Components }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Common questions</h4>
      <div className="flex flex-col">
        {entries.map((entry, index) => {
          const open = openIndex === index
          return (
            <div key={entry.question} className="border-b border-border last:border-b-0">
              <button type="button" onClick={() => setOpenIndex(open ? null : index)} className="flex w-full items-start gap-2 py-2 text-left">
                <ChevronDown size={14} className={`mt-0.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                <span className="text-sm font-medium">{entry.question}</span>
              </button>
              {open && (
                <div className="prose prose-sm dark:prose-invert max-w-none pb-3 pl-6 text-sm text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {entry.answer}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
