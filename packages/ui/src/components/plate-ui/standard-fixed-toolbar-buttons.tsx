'use client'

import React from 'react'

import { BoldPlugin, CodePlugin, ItalicPlugin, StrikethroughPlugin, UnderlinePlugin } from '@udecode/plate-basic-marks/react'
import { FontBackgroundColorPlugin, FontColorPlugin } from '@udecode/plate-font/react'
import { HighlightPlugin } from '@udecode/plate-highlight/react'
import { AudioPlugin, FilePlugin, ImagePlugin, VideoPlugin } from '@udecode/plate-media/react'
import { useEditorReadOnly } from '@udecode/plate/react'
import { ArrowUpToLineIcon, BaselineIcon, BoldIcon, Code2Icon, HighlighterIcon, ItalicIcon, PaintBucketIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'

import { MoreDropdownMenu } from '../plate-ui/more-dropdown-menu'

import { AIToolbarButton } from './ai-toolbar-button'
import { AlignDropdownMenu } from './align-dropdown-menu'
import { ColorDropdownMenu } from './color-dropdown-menu'
import { CommentToolbarButton } from './comment-toolbar-button'
import { EmojiDropdownMenu } from './emoji-dropdown-menu'
import { ExportToolbarButton } from './export-toolbar-button'
import { FontSizeToolbarButton } from './font-size-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button'
import { ImportToolbarButton } from './import-toolbar-button'
import { BulletedIndentListToolbarButton, NumberedIndentListToolbarButton } from './indent-list-toolbar-button'
import { IndentTodoToolbarButton } from './indent-todo-toolbar-button'
import { IndentToolbarButton } from './indent-toolbar-button'
import { InsertDropdownMenu } from './insert-dropdown-menu'
import { LineHeightDropdownMenu } from './line-height-dropdown-menu'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { MediaToolbarButton } from './media-toolbar-button'
import { ModeDropdownMenu } from './mode-dropdown-menu'
import { OutdentToolbarButton } from './outdent-toolbar-button'
import { TableDropdownMenu } from './table-dropdown-menu'
import { ToggleToolbarButton } from './toggle-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu'
import { useShortcutSuffix } from 'console/src/components/shared/shortcut-suffix/shortcut-suffix.tsx'

export function StandardFixedToolbarButtons() {
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

          {/*<ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup>*/}

          <ToolbarGroup>
            <ExportToolbarButton>
              <ArrowUpToLineIcon />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertDropdownMenu />
            <TurnIntoDropdownMenu variant="standard" />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip={`Bold (${suffix}+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip={`Italic (${suffix}+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip={`Underline (${suffix}+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={StrikethroughPlugin.key} tooltip={`Strikethrough (${suffix}+⇧+M)`}>
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip={`Code (${suffix}+E)`}>
              <Code2Icon />
            </MarkToolbarButton>

            <ColorDropdownMenu nodeType={FontColorPlugin.key} tooltip="Text color">
              <BaselineIcon />
            </ColorDropdownMenu>

            <ColorDropdownMenu nodeType={FontBackgroundColorPlugin.key} tooltip="Background color">
              <PaintBucketIcon />
            </ColorDropdownMenu>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignDropdownMenu />

            <NumberedIndentListToolbarButton />
            <BulletedIndentListToolbarButton />
            <IndentTodoToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableDropdownMenu />
            <EmojiDropdownMenu />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={ImagePlugin.key} />
            <MediaToolbarButton nodeType={VideoPlugin.key} />
            <MediaToolbarButton nodeType={AudioPlugin.key} />
            <MediaToolbarButton nodeType={FilePlugin.key} />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightDropdownMenu />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreDropdownMenu />
          </ToolbarGroup>
        </>
      )}

      <div className="grow" />

      <ToolbarGroup>
        <MarkToolbarButton nodeType={HighlightPlugin.key} tooltip="Highlight">
          <HighlighterIcon />
        </MarkToolbarButton>
        <CommentToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <ModeDropdownMenu />
      </ToolbarGroup>
    </div>
  )
}
