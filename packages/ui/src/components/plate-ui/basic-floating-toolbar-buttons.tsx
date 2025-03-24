'use client'

import React from 'react'

import { BoldPlugin, CodePlugin, ItalicPlugin, UnderlinePlugin } from '@udecode/plate-basic-marks/react'
import { useEditorReadOnly } from '@udecode/plate/react'
import { BoldIcon, Code2Icon, ItalicIcon, UnderlineIcon } from 'lucide-react'

import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu'

export function BasicFloatingToolbarButtons() {
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <TurnIntoDropdownMenu variant="basic" />

            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip="Underline (⌘+U)">
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>
          </ToolbarGroup>

          <LinkToolbarButton />
        </>
      )}
    </>
  )
}
