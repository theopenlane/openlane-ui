'use client'

import React from 'react'

import { BoldPlugin, CodePlugin, ItalicPlugin, UnderlinePlugin } from '@udecode/plate-basic-marks/react'
import { useEditorReadOnly } from '@udecode/plate/react'
import { BoldIcon, Code2Icon, ItalicIcon, UnderlineIcon } from 'lucide-react'

import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu'
import { useShortcutSuffix } from 'console/src/components/shared/shortcut-suffix/shortcut-suffix.tsx'

export function MinimalFloatingToolbarButtons() {
  const readOnly = useEditorReadOnly()
  const { suffix } = useShortcutSuffix()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <TurnIntoDropdownMenu variant="basic" />

            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip={`Bold (${suffix}+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip={`Italic (${suffix}+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip={`Underline (${suffix}+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>
          </ToolbarGroup>

          <LinkToolbarButton />
        </>
      )}
    </>
  )
}
