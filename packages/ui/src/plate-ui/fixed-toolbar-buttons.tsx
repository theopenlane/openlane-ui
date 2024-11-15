'use client';

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from '@udecode/plate-basic-marks/react';
import { useEditorReadOnly, useEditorRef } from '@udecode/plate-common/react';
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
} from '@udecode/plate-font/react';
import { ListStyleType } from '@udecode/plate-indent-list';
import { ImagePlugin } from '@udecode/plate-media/react';
import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  PaintBucketIcon,
  Redo,
  Save,
  StrikethroughIcon,
  UnderlineIcon,
  Undo,
} from 'lucide-react';

import { CommentEditSaveButton } from '@udecode/plate-comments/react';
import { AlignDropdownMenu } from './align-dropdown-menu';
import { ColorDropdownMenu } from './color-dropdown-menu';
import { EmojiDropdownMenu } from './emoji-dropdown-menu';
import { IndentListToolbarButton } from './indent-list-toolbar-button';
import { IndentToolbarButton } from './indent-toolbar-button';
import { InsertDropdownMenu } from './insert-dropdown-menu';
import { LineHeightDropdownMenu } from './line-height-dropdown-menu';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { ModeDropdownMenu } from './mode-dropdown-menu';
import { OutdentToolbarButton } from './outdent-toolbar-button';
import { TableDropdownMenu } from './table-dropdown-menu';
import { ToggleToolbarButton } from './toggle-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu';
import { Button } from './button';

export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();
  const editor = useEditorRef();

  return (
    <div className='flex w-full p-1'>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <MarkToolbarButton nodeType="save" tooltip='Save' onClick={() => {
                      alert('Coming soon')
                    }}>
              <Save />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType="undo" tooltip='Undo' onClick={() => {
                     editor.undo()
                    }}>
              <Undo />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType="redo" tooltip='Redo' onClick={() => {
                      editor.redo()
                    }}>
              <Redo />
            </MarkToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertDropdownMenu />
            <TurnIntoDropdownMenu />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip='Bold (⌘+B)'>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={ItalicPlugin.key}
              tooltip='Italic (⌘+I)'
            >
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={UnderlinePlugin.key}
              tooltip='Underline (⌘+U)'
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={StrikethroughPlugin.key}
              tooltip='Strikethrough (⌘+⇧+M)'
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip='Code (⌘+E)'>
              <Code2Icon />
            </MarkToolbarButton>

            <ColorDropdownMenu
              nodeType={FontColorPlugin.key}
              tooltip='Text color'
            >
              <BaselineIcon />
            </ColorDropdownMenu>

            <ColorDropdownMenu
              nodeType={FontBackgroundColorPlugin.key}
              tooltip='Background color'
            >
              <PaintBucketIcon />
            </ColorDropdownMenu>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignDropdownMenu />
            <LineHeightDropdownMenu />

            <IndentListToolbarButton nodeType={ListStyleType.Disc} />
            <IndentListToolbarButton nodeType={ListStyleType.Decimal} />

            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <ToggleToolbarButton />
            <MediaToolbarButton nodeType={ImagePlugin.key} />
            <TableDropdownMenu />
            <EmojiDropdownMenu />
          </ToolbarGroup>
        </>
      )}

      <div className='grow' />

      <ToolbarGroup>
        <ModeDropdownMenu />
      </ToolbarGroup>
    </div>
  );
}
