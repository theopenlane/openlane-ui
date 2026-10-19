'use client'

import DOMPurify, { type Config as DOMPurifyConfig, type DOMPurify as DOMPurifyInstance } from 'dompurify'

export const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export const isSafeLinkHref = (href: string, baseOrigin: string): boolean => {
  let protocol: string
  try {
    protocol = new URL(href, baseOrigin).protocol
  } catch {
    return false
  }
  return SAFE_LINK_PROTOCOLS.has(protocol)
}

export const HTML_SANITIZE_CONFIG: DOMPurifyConfig = {
  FORBID_TAGS: ['iframe', 'object', 'embed', 'form', 'meta', 'base'],
  FORBID_ATTR: ['srcdoc', 'formaction', 'onload', 'onerror'],
}

export const HTML_DOCUMENT_SANITIZE_CONFIG = {
  WHOLE_DOCUMENT: true,
  FORBID_TAGS: ['iframe', 'object', 'embed', 'form', 'base'],
  FORBID_ATTR: ['srcdoc', 'formaction', 'onload', 'onerror'],
} satisfies DOMPurifyConfig

let sharedPurifier: DOMPurifyInstance | null = null

const createHtmlPurifier = (): DOMPurifyInstance => {
  const dp = DOMPurify(window)
  dp.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node instanceof HTMLAnchorElement) {
      const href = node.getAttribute('href')
      if (!href || !isSafeLinkHref(href, window.location.origin)) {
        node.removeAttribute('href')
        return
      }
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noreferrer noopener')
    }
  })
  return dp
}

const getHtmlPurifier = (): DOMPurifyInstance | null => {
  if (typeof window === 'undefined') return null
  return (sharedPurifier ??= createHtmlPurifier())
}

export const sanitizeHtml = (value: string, config: DOMPurifyConfig = HTML_SANITIZE_CONFIG): string => getHtmlPurifier()?.sanitize(value, config) ?? ''

export const INLINE_HTML_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'a',
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'code',
    'pre',
    'kbd',
    'p',
    'br',
    'span',
    'div',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  ALLOWED_ATTR: ['href', 'title', 'type', 'start'],
} satisfies DOMPurifyConfig

export const sanitizeInlineHtml = (value: string): string | null => {
  const purifier = getHtmlPurifier()
  if (!purifier) return null
  const html = purifier.sanitize(value, INLINE_HTML_SANITIZE_CONFIG)
  const droppedElement = purifier.removed.some((entry) => 'element' in entry && entry.element.nodeName !== 'BODY')
  return droppedElement ? null : html
}
