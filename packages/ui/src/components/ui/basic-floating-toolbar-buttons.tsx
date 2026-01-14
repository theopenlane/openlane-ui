'use client'

import * as React from 'react'

import { BoldIcon, Code2Icon, ItalicIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly, usePluginOption } from 'platejs/react'

import { InlineEquationToolbarButton } from './equation-toolbar-button'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { MoreToolbarButton } from './more-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { TurnIntoToolbarButton } from './turn-into-toolbar-button'
import { useShortcutSuffix } from 'console/src/components/shared/shortcut-suffix/shortcut-suffix.tsx'
import { CommentToolbarButton } from './comment-toolbar-button.tsx'
import { AIToolbarButton } from './ai-toolbar-button.tsx'
import { discussionPlugin } from '../editor/plugins/discussion-kit.tsx'

export function BasicFloatingToolbarButtons() {
  const readOnly = useEditorReadOnly()
  const { suffix } = useShortcutSuffix()
  const isCreate = usePluginOption(discussionPlugin, 'isCreate') as boolean

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
            </AIToolbarButton>

            <TurnIntoToolbarButton />

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

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
            {!isCreate && <CommentToolbarButton />}
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>{!readOnly && <MoreToolbarButton />}</ToolbarGroup>
    </>
  )
}
