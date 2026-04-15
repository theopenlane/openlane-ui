'use client'

import cloneDeep from 'lodash/cloneDeep.js'
import { BaseAIPlugin, withAIBatch } from '@platejs/ai'
import { AIChatPlugin, AIPlugin, applyAISuggestions, getInsertPreviewStart, streamInsertChunk, useChatChunk } from '@platejs/ai/react'
import { ElementApi, getPluginType, KEYS, PathApi } from 'platejs'
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
          const { startBlock, startInEmptyParagraph } = getInsertPreviewStart(editor)

          editor.getTransforms(BaseAIPlugin).ai.beginPreview({
            originalBlocks: startInEmptyParagraph && startBlock && ElementApi.isElement(startBlock) ? [cloneDeep(startBlock)] : [],
          })

          editor.tf.withoutSaving(() => {
            editor.tf.insertNodes(
              {
                children: [{ text: '' }],
                type: getPluginType(editor, KEYS.aiChat),
              },
              {
                at: PathApi.next(editor.selection!.focus.path.slice(0, 1)),
              },
            )
          })
          editor.setOption(AIChatPlugin, 'streaming', true)
        }

        if (mode === 'insert' && nodes.length > 0) {
          editor.tf.withoutSaving(() => {
            if (!getOption('streaming')) return

            editor.tf.withScrolling(() => {
              streamInsertChunk(editor, chunk, {
                textProps: {
                  [getPluginType(editor, KEYS.ai)]: true,
                },
              })
            })
          })
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
