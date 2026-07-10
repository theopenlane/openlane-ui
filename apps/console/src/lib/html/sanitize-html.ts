'use client'

import { useMemo } from 'react'
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify'

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

export const useHtmlPurifier = () => {
  return useMemo(() => {
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
  }, [])
}
