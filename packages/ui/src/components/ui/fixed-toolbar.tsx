'use client'

import { cn } from '@repo/ui/lib/utils'

import { Toolbar } from './toolbar'

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-[var(--fixed-toolbar-top,0px)] left-0 z-[var(--fixed-toolbar-z,2)] scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background p-1',
        props.className,
      )}
    />
  )
}
