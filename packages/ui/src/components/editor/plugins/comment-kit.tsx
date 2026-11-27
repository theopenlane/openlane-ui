'use client'

import type { ExtendConfig, Path, TCommentText } from 'platejs'

import { type BaseCommentConfig, BaseCommentPlugin, getCommentKeyId, getCommentKeys, getDraftCommentKey } from '@platejs/comment'
import { isSlateString } from 'platejs'
import { toTPlatePlugin } from 'platejs/react'

import { CommentLeaf } from '@theopenlane/ui/components/ui/comment-node.tsx'

export const getCommentLeafIds = (leaf: TCommentText, shownIds: ReadonlySet<string>): { visibleIds: string[]; currentId: string | undefined } => {
  const draftKey = getDraftCommentKey()
  const visibleIds = getCommentKeys(leaf)
    .filter((key) => key !== draftKey)
    .map(getCommentKeyId)
    .filter((id) => shownIds.has(id))

  return { visibleIds, currentId: leaf[draftKey] ? undefined : visibleIds.at(-1) }
}

type CommentConfig = ExtendConfig<
  BaseCommentConfig,
  {
    activeId: string | null
    commentingBlock: Path | null
    shownIds: ReadonlySet<string>
    hoverId: string | null
    uniquePathMap: Map<string, Path>
  }
>

export const commentPlugin = toTPlatePlugin<CommentConfig>(BaseCommentPlugin, {
  handlers: {
    onClick: ({ api, editor, event, setOption, type }) => {
      let leaf = event.target as HTMLElement
      let isSet = false

      const unsetActiveSuggestion = () => {
        setOption('activeId', null)
        isSet = true
      }

      if (!isSlateString(leaf)) unsetActiveSuggestion()

      while (leaf.parentElement) {
        if (leaf.classList.contains(`slate-${type}`)) {
          const commentNode = api.comment!.node()?.[0]
          const id = commentNode && getCommentLeafIds(commentNode, editor.getOption(commentPlugin, 'shownIds')).currentId

          if (!id) {
            unsetActiveSuggestion()

            break
          }

          setOption('activeId', id)
          isSet = true

          break
        }

        leaf = leaf.parentElement
      }

      if (!isSet) unsetActiveSuggestion()
    },
  },
  options: {
    activeId: null,
    commentingBlock: null,
    shownIds: new Set<string>(),
    hoverId: null,
    uniquePathMap: new Map(),
  },
})
  .extendTransforms(
    ({
      api,
      editor,
      setOption,
      tf: {
        comment: { setDraft },
      },
    }) => ({
      setDraft: () => {
        if (!editor.selection) {
          editor.tf.select([0, 0])
        } else if (editor.api.isCollapsed()) {
          editor.tf.select(editor.api.block()![1])
        }

        setDraft()

        editor.tf.collapse()
        setOption('activeId', getDraftCommentKey())
        setOption('commentingBlock', editor.selection!.focus.path.slice(0, 1))
      },
      discardDraft: () => {
        const draftNodes = api.comment!.nodes({ at: [], isDraft: true })

        editor.tf.withoutNormalizing(() => {
          draftNodes.forEach(([, path]) => {
            editor.tf.unsetNodes([getDraftCommentKey()], { at: path })
          })
        })

        setOption('activeId', null)
        setOption('commentingBlock', null)
      },
    }),
  )
  .configure({
    node: { component: CommentLeaf },
    shortcuts: {
      setDraft: { keys: 'mod+shift+m' },
    },
  })

export const CommentKit = [commentPlugin]
