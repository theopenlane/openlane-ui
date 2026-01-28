'use client'

import { BaselineIcon, BoldIcon, Code2Icon, ItalicIcon, PaintBucketIcon, UnderlineIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { AlignToolbarButton } from './align-toolbar-button'
import { FontColorToolbarButton } from './font-color-toolbar-button'
import { FontSizeToolbarButton } from './font-size-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button'
import { IndentToolbarButton, OutdentToolbarButton } from './indent-toolbar-button'
import { InsertToolbarButton } from './insert-toolbar-button'
import { LineHeightToolbarButton } from './line-height-toolbar-button'
import { LinkToolbarButton } from './link-toolbar-button'
import { BulletedListToolbarButton, NumberedListToolbarButton, TodoListToolbarButton } from './list-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { TableToolbarButton } from './table-toolbar-button'
import { ToggleToolbarButton } from './toggle-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { useShortcutSuffix } from 'console/src/components/shared/shortcut-suffix/shortcut-suffix.tsx'
import { ExportToolbarButton } from './export-toolbar-button'
import { ImportToolbarButton } from './import-toolbar-button'

export function BasicToolbarButtons() {
  const readOnly = useEditorReadOnly()
  const { suffix } = useShortcutSuffix()

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <FontSizeToolbarButton />
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`Bold (${suffix}+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`Italic (${suffix}+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={`Underline (${suffix}+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip={`Code (${suffix}+E)`}>
              <Code2Icon />
            </MarkToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
              <BaselineIcon />
            </FontColorToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.backgroundColor} tooltip="Background color">
              <PaintBucketIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />

            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <ExportToolbarButton />
            <ImportToolbarButton />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
