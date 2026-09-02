'use client'

import { cn } from '@repo/ui/lib/utils'

import { Toolbar } from './toolbar'

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      data-slot="fixed-toolbar"
      {...props}
      className={cn(
        'sticky top-[var(--fixed-toolbar-top,0px)] left-0 z-(--editor-z-fixed-toolbar) scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background p-1',
        props.className,
      )}
    />
  )
}
