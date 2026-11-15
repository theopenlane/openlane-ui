'use client'

import * as React from 'react'

import { SuggestionPlugin } from '@platejs/suggestion/react'
import { PencilLineIcon } from 'lucide-react'
import { useEditorPlugin, usePluginOption } from 'platejs/react'

import { ToolbarButton } from './toolbar'

export function SuggestionToolbarButton() {
  const { setOption } = useEditorPlugin(SuggestionPlugin)
  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting')

  return (
    <ToolbarButton onClick={() => setOption('isSuggesting', !isSuggesting)} onMouseDown={(e) => e.preventDefault()} tooltip={isSuggesting ? 'Turn off suggesting' : 'Suggestion edits'}>
      <PencilLineIcon />
    </ToolbarButton>
  )
}
