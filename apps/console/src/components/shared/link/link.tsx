import React from 'react'
import NextLink from 'next/link'
import { ExternalLink } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

export const LINK_CLASS_NAME = 'text-hyperlink hover:underline'

type TLinkProps = React.ComponentProps<typeof NextLink> & {
  newTab?: boolean
}

export const Link = ({ className, newTab = false, prefetch, children, ...props }: TLinkProps) => {
  if (!newTab) {
    return (
      <NextLink className={cn(LINK_CLASS_NAME, className)} prefetch={prefetch} {...props}>
        {children}
      </NextLink>
    )
  }

  return (
    <NextLink target="_blank" rel="noopener noreferrer" prefetch={prefetch ?? false} className={cn('inline-flex items-center gap-1 align-middle', LINK_CLASS_NAME, className)} {...props}>
      {children}
      <ExternalLink className="size-[1em] shrink-0" aria-hidden />
    </NextLink>
  )
}
