'use client'

import React, { useMemo } from 'react'
import { hasHtmlMarkup } from '@/lib/html/html-to-text'
import { sanitizeHtml, sanitizeInlineHtml } from '@/lib/html/sanitize-html'

const stopLinkClick = (event: React.MouseEvent<HTMLElement>) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    event.stopPropagation()
  }
}

type THtmlContainerProps = {
  html: string
  className?: string
}

const HtmlContainer: React.FC<THtmlContainerProps> = ({ html, className }) => <div role="presentation" className={className} onClick={stopLinkClick} dangerouslySetInnerHTML={{ __html: html }} />

type TSanitizedHtmlProps = {
  value: string
  className?: string
}

export const SanitizedHtml: React.FC<TSanitizedHtmlProps> = ({ value, className }) => {
  const html = useMemo(() => sanitizeHtml(value), [value])

  return <HtmlContainer html={html} className={className} />
}

const INLINE_HTML_CLASS = 'prose prose-sm dark:prose-invert max-w-none whitespace-normal break-words text-inherit [&_a]:text-blue-500 [&_a]:no-underline [&_a:hover]:underline'

const renderPlainText = (value: string) => <span className="whitespace-pre-wrap">{value}</span>

type THtmlOrTextProps = {
  value: string
  renderText?: (value: string) => React.ReactNode
}

export const HtmlOrText: React.FC<THtmlOrTextProps> = ({ value, renderText = renderPlainText }) => {
  const html = useMemo(() => (hasHtmlMarkup(value) ? sanitizeInlineHtml(value) : null), [value])

  return html === null ? renderText(value) : <HtmlContainer html={html} className={INLINE_HTML_CLASS} />
}
