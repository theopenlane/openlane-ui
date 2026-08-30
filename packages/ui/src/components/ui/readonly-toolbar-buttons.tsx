'use client'

import { cn } from '@repo/ui/lib/utils'
import { ToolbarGroup } from './toolbar'
import { ExportToolbarButton } from './export-toolbar-button'
import { CommentToolbarButton, useCanComment } from './comment-toolbar-button'

type ReadOnlyToolbarButtonsProps = {
  title?: string
  className?: string
}

export function ReadOnlyToolbarButtons({ title = 'Document', className }: ReadOnlyToolbarButtonsProps) {
  const canComment = useCanComment()

  return (
    <div className={cn('flex justify-end w-full bg-none mt-[-7rem] border-none pointer-events-none', className)}>
      <ToolbarGroup className="pointer-events-auto">
        <ExportToolbarButton title={title} />
      </ToolbarGroup>
      {canComment && (
        <ToolbarGroup className="pointer-events-auto">
          <CommentToolbarButton />
        </ToolbarGroup>
      )}
    </div>
  )
}
