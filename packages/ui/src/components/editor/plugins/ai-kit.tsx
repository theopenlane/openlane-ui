'use client'

import { AIChatPlugin, AIPlugin } from '@platejs/ai/react'
import { usePluginOption } from 'platejs/react'
import { useEffect, useRef } from 'react'

import { useNotification } from 'console/src/hooks/useNotification'

import { applyAIEdit, beginAIInsert, renderAIInsert } from '@repo/ui/components/editor/ai-preview.ts'
import { AILoadingBar, AIMenu } from '@repo/ui/components/ui/ai-menu.tsx'
import { AIAnchorElement, AILeaf } from '@repo/ui/components/ui/ai-node.tsx'

import { useChat } from '../use-chat'
import { CursorOverlayKit } from './cursor-overlay-kit'
import { MarkdownKit } from './markdown-kit'
import { SuggestionPlugin } from '@platejs/suggestion/react'
import { SuggestionLeaf } from '@repo/ui/components/ui/suggestion-node.tsx'

export const aiChatPlugin = AIChatPlugin.extend({
  options: {
    chatOptions: {
      api: '/api/ai/command',
      body: {},
    },
  },
  render: {
    afterContainer: AILoadingBar,
    afterEditable: AIMenu,
    node: AIAnchorElement,
  },
  shortcuts: { show: { keys: 'mod+j' } },
  useHooks: ({ editor }) => {
    useChat()

    const chat = usePluginOption(AIChatPlugin, 'chat')
    const mode = usePluginOption(AIChatPlugin, 'mode')
    const toolName = usePluginOption(AIChatPlugin, 'toolName')
    const wasLoadingRef = useRef(false)
    const { errorNotification } = useNotification()
    const hasStartedInsertRef = useRef(false)

    const isLoading = chat.status === 'streaming' || chat.status === 'submitted'
    const lastMessage = chat.messages?.at(-1)
    const content = lastMessage?.role === 'assistant' ? lastMessage.parts.find((part) => part.type === 'text')?.text : undefined

    useEffect(() => {
      if (!isLoading && !wasLoadingRef.current) return
      wasLoadingRef.current = isLoading

      if (content?.trim() && toolName !== 'comment') {
        if (mode === 'insert') {
          if (!hasStartedInsertRef.current) {
            hasStartedInsertRef.current = true
            beginAIInsert(editor)
          }
          renderAIInsert(editor, content)
        }

        if (toolName === 'edit' && mode === 'chat' && !isLoading) {
          if (!applyAIEdit(editor, content)) {
            errorNotification({ title: 'AI edit failed', description: 'The answer could not be applied to the selected text. Please try again.' })
            editor.getApi(AIChatPlugin).aiChat.hide()
          }
        }
      }

      if (!isLoading) {
        hasStartedInsertRef.current = false
        editor.setOption(AIChatPlugin, 'streaming', false)
        editor.setOption(AIChatPlugin, '_blockPath', null)
      }
    }, [content, editor, errorNotification, isLoading, mode, toolName])
  },
})

export const AIKit = [...CursorOverlayKit, ...MarkdownKit, SuggestionPlugin.withComponent(SuggestionLeaf), AIPlugin.withComponent(AILeaf), aiChatPlugin]
