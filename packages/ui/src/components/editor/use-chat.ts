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

import { useNotification } from 'console/src/hooks/useNotification'

import { aiChatPlugin } from './plugins/ai-kit'

import { canCommentOnEntity, discussionPlugin, type TDiscussion } from './plugins/discussion-kit'

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

const chatErrorMessage = ({ message }: Error): string => {
  try {
    const { error } = JSON.parse(message) as { error?: string }
    return error ?? message
  } catch {
    return message
  }
}

export const useChat = (): Chat => {
  const editor = useEditorRef()
  const { errorNotification } = useNotification()
  const options = usePluginOption(aiChatPlugin, 'chatOptions')

  const chat = useBaseChat<ChatMessage>({
    id: 'editor',

    transport: new DefaultChatTransport({
      api: options.api || '/api/ai/command',
      body: () => ({ canComment: canCommentOnEntity(editor.getOptions(discussionPlugin)) }),
    }),

    onError(error) {
      errorNotification({ title: 'AI request failed', description: chatErrorMessage(error) })
      editor.getApi(AIChatPlugin).aiChat.hide()
    },

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
        const currentUserId = editor.getOption(discussionPlugin, 'currentUserId')
        if (!range || !currentUserId) return

        const discussions = editor.getOption(discussionPlugin, 'discussions') || []

        const discussionId = nanoid()

        const newComment = {
          id: nanoid(),
          contentRich: [{ id: nanoid(), children: [{ text: comment.comment }], type: KEYS.p }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: currentUserId,
        }

        const newDiscussion: TDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor, comment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join('\n'),
          isResolved: false,
          userId: currentUserId,
        }

        editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion])
        editor.setOption(discussionPlugin, 'pendingAiDiscussions', [...editor.getOption(discussionPlugin, 'pendingAiDiscussions'), newDiscussion])

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
