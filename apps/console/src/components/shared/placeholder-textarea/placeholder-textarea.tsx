'use client'

import { useRef, useState, type ChangeEvent, type UIEvent } from 'react'
import { Textarea } from '@repo/ui/textarea'

// {{ like this }}
const PLACEHOLDER = /(\{\{.*?\}\})/g

// A textarea cannot style its own contents, so the highlight is a mirrored
// layer behind it that has to match the textarea's box and typography exactly
const SHARED_TEXT_CLASSES = 'w-full rounded-md border border-transparent px-3 py-2 text-base leading-normal md:text-sm'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

// Textarea that marks {{ placeholder }} spans left over from a template, so the
// user can see what still needs filling in as they edit
export function PlaceholderTextarea({ value, onChange, placeholder, rows = 2 }: Props) {
  const highlightRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => setScrollTop(event.currentTarget.scrollTop)

  return (
    <div className="relative">
      <div
        ref={highlightRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-transparent ${SHARED_TEXT_CLASSES}`}
        style={{ transform: `translateY(-${scrollTop}px)` }}
      >
        {value.split(PLACEHOLDER).map((part, index) =>
          PLACEHOLDER.test(part) ? (
            <mark key={index} className="rounded-xs bg-[var(--color-warning)]/25 text-transparent">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
        {/* a trailing newline needs something after it to render its line */}
        {value.endsWith('\n') ? ' ' : null}
      </div>

      <Textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.currentTarget.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        rows={rows}
        className={`relative bg-transparent ${SHARED_TEXT_CLASSES}`}
      />
    </div>
  )
}
