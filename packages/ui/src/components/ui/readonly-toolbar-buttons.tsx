'use client'

import { ToolbarGroup } from './toolbar'
import { ExportToolbarButton } from './export-toolbar-button'
import { CommentToolbarButton } from './comment-toolbar-button'

export function ReadyOnlyToolbarButtons() {
  return (
    <div className="flex justify-end w-full bg-none mt-[-7rem] border-none">
      <>
        <ToolbarGroup>
          <ExportToolbarButton />
        </ToolbarGroup>
        <ToolbarGroup>
          <CommentToolbarButton />
        </ToolbarGroup>
      </>
    </div>
  )
}
