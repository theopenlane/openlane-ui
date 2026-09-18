'use client'

import { type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { formatUrlForDisplay, normalizeHref } from '@/utils/normalizeUrl'

interface ExternalLinkValueProps {
  value?: string | null
  className?: string
  fallback?: ReactNode
}

export const ExternalLinkValue = ({ value, className, fallback = null }: ExternalLinkValueProps) => {
  const href = normalizeHref(value)

  if (!href) {
    return fallback
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className={cn('inline-flex max-w-full items-center gap-1.5 align-middle text-blue-600 dark:text-blue-400 hover:underline', className)}
      onClick={(e) => e.stopPropagation()}
      onAuxClick={(e) => e.stopPropagation()}
    >
      <span className="truncate">{formatUrlForDisplay(href) || href}</span>
      <ExternalLink className="size-3.5 shrink-0" />
    </a>
  )
}
