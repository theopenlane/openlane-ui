'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/themes/prism-tomorrow.css'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'

export type CodeBlockLanguage = 'html' | 'json' | 'markdown' | 'text' | 'markup'

interface CodeBlockProps {
  code: string
  language?: CodeBlockLanguage
  title?: string
  showLineNumbers?: boolean
  className?: string
}

const LANGUAGE_ALIAS: Record<CodeBlockLanguage, string> = {
  html: 'markup',
  markup: 'markup',
  json: 'json',
  markdown: 'markdown',
  text: 'text',
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text', title, showLineNumbers = false, className }) => {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const prismLang = LANGUAGE_ALIAS[language] ?? 'text'

  const highlighted = useMemo(() => {
    if (prismLang === 'text' || !Prism.languages[prismLang]) {
      return null
    }
    try {
      return Prism.highlight(code, Prism.languages[prismLang], prismLang)
    } catch {
      return null
    }
  }, [code, prismLang])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      /* noop */
    }
  }

  return (
    <div className={cn('relative group rounded-lg border border-border bg-muted/50 overflow-hidden', className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <span className="text-xs font-mono text-muted-foreground">{title}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md border border-border bg-background/80 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100 cursor-pointer"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
      <pre className={cn('overflow-x-auto p-4 text-xs leading-relaxed', showLineNumbers && 'line-numbers')}>
        <code
          ref={codeRef}
          className={cn('font-mono', `language-${prismLang}`)}
          {...(highlighted ? { dangerouslySetInnerHTML: { __html: highlighted } } : {})}
        >
          {highlighted ? null : code}
        </code>
      </pre>
    </div>
  )
}
