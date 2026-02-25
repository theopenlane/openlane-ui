'use client'

import { cn } from '@repo/ui/lib/utils'
import { ToolbarGroup } from './toolbar'
import { ExportToolbarButton } from './export-toolbar-button'
import { CommentToolbarButton } from './comment-toolbar-button'

type ReadOnlyToolbarButtonsProps = {
  title?: string
  className?: string
}

export function ReadOnlyToolbarButtons({ title = 'Document', className }: ReadOnlyToolbarButtonsProps) {
  return (
    <div className={cn('flex justify-end w-full bg-none mt-[-7rem] border-none', className)}>
      <ToolbarGroup>
        <ExportToolbarButton title={title} />
      </ToolbarGroup>
      <ToolbarGroup>
        <CommentToolbarButton />
      </ToolbarGroup>
    </div>
  )
}
