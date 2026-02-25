'use client'

import { withAIBatch } from '@platejs/ai'
import { AIChatPlugin, AIPlugin, applyAISuggestions, streamInsertChunk, useChatChunk } from '@platejs/ai/react'
import { getPluginType, KEYS } from 'platejs'
import { usePluginOption } from 'platejs/react'

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
  useHooks: ({ editor, getOption }) => {
    useChat()

    const mode = usePluginOption(AIChatPlugin, 'mode')
    const toolName = usePluginOption(AIChatPlugin, 'toolName')
    useChatChunk({
      onChunk: ({ chunk, isFirst, nodes, text: content }) => {
        if (isFirst && mode === 'insert') {
          editor.tf.withoutSaving(() => {
            const path = editor.selection?.anchor?.path
            editor.tf.deleteFragment()
            editor.tf.insertNodes(
              {
                children: [{ text: '' }],
                anchor: true,
                type: getPluginType(editor, KEYS.aiChat),
              },
              {
                at: path,
                select: true,
              },
            )
          })
          editor.setOption(AIChatPlugin, 'streaming', true)
        }

        if (mode === 'insert' && nodes.length > 0) {
          withAIBatch(
            editor,
            () => {
              if (!getOption('streaming')) return
              editor.tf.withScrolling(() => {
                streamInsertChunk(editor, chunk, {
                  textProps: {
                    [getPluginType(editor, KEYS.ai)]: true,
                  },
                })
              })
            },
            { split: isFirst },
          )
        }

        if (toolName === 'edit' && mode === 'chat') {
          withAIBatch(
            editor,
            () => {
              applyAISuggestions(editor, content)
            },
            {
              split: isFirst,
            },
          )
        }
      },
      onFinish: () => {
        editor.setOption(AIChatPlugin, 'streaming', false)
        editor.setOption(AIChatPlugin, '_blockChunks', '')
        editor.setOption(AIChatPlugin, '_blockPath', null)
        editor.setOption(AIChatPlugin, '_mdxName', null)
      },
    })
  },
})

export const AIKit = [...CursorOverlayKit, ...MarkdownKit, SuggestionPlugin.withComponent(SuggestionLeaf), AIPlugin.withComponent(AILeaf), aiChatPlugin]
