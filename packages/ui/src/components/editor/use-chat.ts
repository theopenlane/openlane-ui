'use client'

import { type UseChatHelpers, useChat as useBaseChat } from '@ai-sdk/react'
import { AIChatPlugin, aiCommentToRange } from '@platejs/ai/react'
import { getCommentKey, getTransientCommentKey } from '@platejs/comment'
import { deserializeMd } from '@platejs/markdown'
import { BlockSelectionPlugin } from '@platejs/selection/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { KEYS, NodeApi, nanoid, TextApi, type TNode } from 'platejs'
import { useEditorRef, usePluginOption } from 'platejs/react'
import * as React from 'react'

import { aiChatPlugin } from './plugins/ai-kit'

import { discussionPlugin } from './plugins/discussion-kit'

export type ToolName = 'comment' | 'edit' | 'generate'

export type TComment = {
  comment: {
    blockId: string
    comment: string
    content: string
  } | null
  status: 'finished' | 'streaming'
}

export type MessageDataPart = {
  toolName: ToolName
  comment?: TComment
}

export type Chat = UseChatHelpers<ChatMessage>

export type ChatMessage = UIMessage<{}, MessageDataPart>

export const useChat = (): Chat => {
  const editor = useEditorRef()
  const options = usePluginOption(aiChatPlugin, 'chatOptions')

  const chat = useBaseChat<ChatMessage>({
    id: 'editor',

    transport: new DefaultChatTransport({
      api: options.api || '/api/ai/command',
    }),

    onData(data) {
      if (data.type === 'data-toolName') {
        editor.setOption(AIChatPlugin, 'toolName', data.data as ToolName)
        return
      }

      if (data.type === 'data-comment' && data.data) {
        // @ts-ignore – PlateJS typing is incorrect here
        const { comment, status } = data.data

        if (status === 'finished') {
          editor.getApi(BlockSelectionPlugin).blockSelection.deselect()
          return
        }

        if (!comment) return

        const range = aiCommentToRange(editor, comment)
        if (!range) return

        const discussions = editor.getOption(discussionPlugin, 'discussions') || []

        const discussionId = nanoid()

        const newComment = {
          id: nanoid(),
          contentRich: [{ children: [{ text: comment.comment }], type: 'p' }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        }

        const newDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor, comment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join('\n'),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        }

        // @ts-ignore – PlateJS typing is incorrect here
        editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion])

        editor.tf.withMerging(() => {
          editor.tf.setNodes(
            {
              [getCommentKey(discussionId)]: true,
              [getTransientCommentKey()]: true,
              [KEYS.comment]: true,
            },
            {
              at: range,
              match: TextApi.isText,
              split: true,
            },
          )
        })
      }
    },

    ...options,
  })

  React.useEffect(() => {
    editor.setOption(AIChatPlugin, 'chat', chat as any)
  }, [chat.status, chat.messages, chat.error])

  return chat
}
