'use client'

import React from 'react'

import { BoldPlugin, CodePlugin, ItalicPlugin } from '@udecode/plate-basic-marks/react'
import { useEditorReadOnly } from '@udecode/plate/react'
import { BoldIcon, Code2Icon, ItalicIcon } from 'lucide-react'

import { AlignDropdownMenu } from './align-dropdown-menu'
import { FontSizeToolbarButton } from './font-size-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button'
import { BulletedIndentListToolbarButton, NumberedIndentListToolbarButton } from './indent-list-toolbar-button'
import { IndentTodoToolbarButton } from './indent-todo-toolbar-button'
import { LineHeightDropdownMenu } from './line-height-dropdown-menu'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { ToolbarGroup } from './toolbar'

export function MinimalFixedToolbarButtons() {
  const readOnly = useEditorReadOnly()

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>
          </ToolbarGroup>
          <LinkToolbarButton />
        </>
      )}
    </div>
  )
}
