'use client'

import * as React from 'react'

import { BoldIcon, ItalicIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'
import { FontSizeToolbarButton } from './font-size-toolbar-button'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { useShortcutSuffix } from 'console/src/components/shared/shortcut-suffix/shortcut-suffix.tsx'

export function MinimalisticToolbarButtons() {
  const readOnly = useEditorReadOnly()
  const { suffix } = useShortcutSuffix()

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`Bold (${suffix}+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`Italic (${suffix}+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
