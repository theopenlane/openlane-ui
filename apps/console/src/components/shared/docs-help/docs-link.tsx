'use client'

import type { MouseEvent, ReactNode } from 'react'
import { docsHelpAvailable } from '@repo/dally/ai'
import { useDocsHelpNavigate, type DocsHelpTopic } from './docs-help-context'

type TDocsLinkProps = {
  topic: DocsHelpTopic
  href: string
  className?: string
  children: ReactNode
}

export const DocsLink = ({ topic, href, className, children }: TDocsLinkProps) => {
  const navigateDocs = useDocsHelpNavigate()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!docsHelpAvailable || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigateDocs(topic)
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
      {!docsHelpAvailable && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}
