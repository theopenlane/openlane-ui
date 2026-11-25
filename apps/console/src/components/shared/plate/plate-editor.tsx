'use client'

import React, { useEffect, useImperativeHandle, useCallback, type Ref, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { ThemeAwareFontBackgroundColorPlugin, ThemeAwareFontColorPlugin } from '@repo/ui/components/editor/plugins/font-kit.tsx'
import { type Value, type TElement, KEYS } from 'platejs'
import { EditorKitVariant, type TPlateEditorVariants } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer, type TPlateEditorStyleVariant } from '@repo/ui/components/ui/editor.tsx'
import { createPlateEditor, Plate, type PlatePlugin, usePlateEditor } from 'platejs/react'
import { detectFormat } from './usePlateEditor'
import { type CommentEntityType, discussionPlugin } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import { DEFAULT_EXPORT_TITLE, documentExportPlugin } from '@repo/ui/components/editor/plugins/document-export-kit.tsx'
import { suggestionPlugin } from '@repo/ui/components/editor/plugins/suggestion-kit.tsx'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { stripUnsavedCommentMarks } from '@repo/ui/components/editor/comment-utils.ts'
import { type GetUserProfileQuery } from '@repo/codegen/src/schema.ts'
import { mapEntityDiscussions, type TDiscussionEntity, useDiscussionUsers } from './discussions'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  onHydrate?: (data: Value) => void
  initialValue?: string | Value
  variant?: TPlateEditorVariants
  styleVariant?: TPlateEditorStyleVariant
  clearData?: boolean
  onClear?: () => void
  placeholder?: string
  ariaLabel?: string
  entity?: TDiscussionEntity
  userData?: GetUserProfileQuery
  readonly?: boolean
  isCreate?: boolean
  toolbarClassName?: string
  containerClassName?: string
  onExportPdf?: () => void
  exportTitle?: string
  ref?: Ref<PlateEditorRef>
}

export interface PlateEditorRef {
  insertContent: (text: string, clearBeforeInsert?: boolean) => void
  editor: ReturnType<typeof createPlateEditor>
}

const PlateEditor = ({
  onChange,
  onHydrate,
  initialValue,
  variant = 'basic',
  styleVariant,
  clearData,
  onClear,
  placeholder,
  ariaLabel,
  entity,
  userData,
  readonly,
  isCreate,
  toolbarClassName,
  containerClassName,
  onExportPdf,
  exportTitle,
  ref,
}: TPlateEditorProps) => {
  const getPlugins = useCallback(() => EditorKitVariant[variant]({ toolbarClassName }) as PlatePlugin[], [variant, toolbarClassName])

  const [initialSlateValue] = React.useState(() => (Array.isArray(initialValue) ? stripUnsavedCommentMarks(initialValue) : undefined))

  const editor = usePlateEditor({
    plugins: getPlugins(),
    value: initialSlateValue,
  })

  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return
    editor.setOption(ThemeAwareFontColorPlugin, 'theme', resolvedTheme)
    editor.setOption(ThemeAwareFontBackgroundColorPlugin, 'theme', resolvedTheme)
  }, [editor, resolvedTheme])

  const { data: session } = useSession()
  const suggestionUserId = userData?.user?.id ?? session?.user?.userId ?? null
  useEffect(() => {
    editor.setOption(suggestionPlugin, 'currentUserId', suggestionUserId)
  }, [editor, suggestionUserId])

  const resolvedExportTitle = exportTitle?.trim() || getObjectDisplayName(entity) || DEFAULT_EXPORT_TITLE
  useEffect(() => {
    editor.setOptions(documentExportPlugin, { onExportPdf: onExportPdf ?? null, title: resolvedExportTitle })
  }, [editor, onExportPdf, resolvedExportTitle])

  const plateEditor = React.useMemo(
    () =>
      createPlateEditor({
        plugins: getPlugins(),
      }),
    [getPlugins],
  )

  const initialValueSetRef = useRef(false)

  const discussions = React.useMemo(() => (entity ? mapEntityDiscussions(entity) : []), [entity])
  const discussionUsers = useDiscussionUsers(discussions, userData?.user)

  useEffect(() => {
    editor.setOption(discussionPlugin, 'isCreate', !!isCreate)
  }, [editor, isCreate])

  useEffect(() => {
    if (!entity || !userData?.user) return

    editor.setOption(discussionPlugin, 'entityType', entity.__typename as CommentEntityType)
    editor.setOption(discussionPlugin, 'entityId', entity.id)
    editor.setOption(discussionPlugin, 'currentUserId', userData.user.id)
    const savedIds = new Set(discussions.map((discussion) => discussion.id))
    const unsavedAiDiscussions = editor.getOption(discussionPlugin, 'pendingAiDiscussions').filter((discussion) => !savedIds.has(discussion.id))
    editor.setOption(discussionPlugin, 'discussions', [...discussions, ...unsavedAiDiscussions])
  }, [editor, entity, userData, discussions])

  useEffect(() => {
    editor.setOption(discussionPlugin, 'users', discussionUsers)
  }, [editor, discussionUsers])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    insertContent: (text: string, clearBeforeInsert?: boolean) => {
      if (!editor) return

      // @ts-expect-error fix bad typing from platejs
      // Deserialize markdown to Slate nodes
      const nodes = (editor.api.markdown?.deserialize?.(text) ?? []) as Value

      // Clear existing content if requested and insert new content
      if (clearBeforeInsert) {
        editor.tf.reset()
        editor.tf.insertNodes(nodes, { at: [0], removeEmpty: true })
        return
      }

      // Insert at current selection
      editor.tf.insertNodes(nodes, {
        select: true,
        mode: 'highest',
      })
    },
    editor,
  }))

  useEffect(() => {
    if (plateEditor && !initialValueSetRef.current && initialValue) {
      initialValueSetRef.current = true

      if (Array.isArray(initialValue)) {
        return
      }

      let slateNodes
      const fmt = detectFormat(initialValue)
      if (fmt === 'html') {
        slateNodes = plateEditor.api.html.deserialize({
          element: initialValue || '',
        }) as Value
      } else {
        // @ts-expect-error fix bad typing from platejs
        slateNodes = (plateEditor.api.markdown?.deserialize?.(initialValue || '') ?? []) as Value
      }

      if (Array.isArray(slateNodes) && slateNodes.length === 1 && typeof (slateNodes[0] as TElement).text === 'string' && !(slateNodes[0] as TElement).type) {
        if (slateNodes[0].text === '') {
          return
        }
        editor.tf.insertNodes(
          {
            children: slateNodes as Value,
            type: KEYS.p,
          },
          { select: true, nextBlock: false, at: [0], removeEmpty: true },
        )
      } else {
        editor.tf.reset()
        editor.tf.insertNodes(slateNodes, { at: [0], removeEmpty: true })
      }

      onHydrate?.(stripUnsavedCommentMarks(editor.children as Value))
    }
  }, [editor, initialValue, plateEditor, onHydrate])

  useEffect(() => {
    if (clearData) {
      editor.transforms.reset()
      onClear?.()
    }
  }, [clearData, editor.transforms, onClear])

  return (
    <Plate
      readOnly={readonly}
      editor={editor}
      onChange={(data) => {
        onChange?.(stripUnsavedCommentMarks(data.value, editor.getOption(discussionPlugin, 'pendingAiDiscussions')))
      }}
    >
      <EditorContainer
        className={containerClassName}
        variant={readonly ? 'readonly' : styleVariant}
        onClick={(event) => {
          if (!readonly && event.target === event.currentTarget) editor.tf.focus()
        }}
      >
        <Editor aria-label={ariaLabel ?? placeholder ?? 'Rich text editor'} placeholder={placeholder ?? 'Type a paragraph'} variant={readonly ? 'readonly' : undefined} />
      </EditorContainer>
    </Plate>
  )
}

export default React.memo(PlateEditor)
