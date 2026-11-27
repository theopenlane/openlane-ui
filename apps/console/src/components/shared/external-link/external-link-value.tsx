'use client'

import { type ReactNode } from 'react'
import { Link } from '@/components/shared/link/link'
import { cn } from '@theopenlane/ui/lib/utils'
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
    <Link href={href} newTab title={href} className={cn('max-w-full', className)} onClick={(e) => e.stopPropagation()} onAuxClick={(e) => e.stopPropagation()}>
      <span className="truncate">{formatUrlForDisplay(href) || href}</span>
    </Link>
  )
}
