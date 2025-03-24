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
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu'

export function BasicFixedToolbarButtons() {
  const readOnly = useEditorReadOnly()

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoDropdownMenu variant="basic" />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignDropdownMenu />

            <NumberedIndentListToolbarButton />
            <BulletedIndentListToolbarButton />
            <IndentTodoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightDropdownMenu />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
