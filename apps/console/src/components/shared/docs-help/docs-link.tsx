'use client'

import type { MouseEvent, ReactNode } from 'react'
import { docsHelpAvailable } from '@repo/dally/ai'
import { useDocsHelpNavigate, type DocsHelpTopic } from './docs-help-context'
import { isModifiedClick } from '@/utils/mouse-event'

type TDocsLinkProps = {
  topic: DocsHelpTopic
  href: string
  className?: string
  children: ReactNode
}

export const DocsLink = ({ topic, href, className, children }: TDocsLinkProps) => {
  const navigateDocs = useDocsHelpNavigate()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!docsHelpAvailable || isModifiedClick(event)) {
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
