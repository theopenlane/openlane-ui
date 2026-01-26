'use client'

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Value, TElement, KEYS } from 'platejs'
import { EditorKitVariant, TPlateEditorVariants } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer, TPlateEditorStyleVariant } from '@repo/ui/components/ui/editor.tsx'
import { createPlateEditor, Plate, PlatePlugin, usePlateEditor } from 'platejs/react'
import { detectFormat } from './usePlateEditor'
import { discussionPlugin, TDiscussion } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import {
  ControlDiscussionFieldsFragment,
  GetUserProfileQuery,
  PolicyDiscussionFieldsFragment,
  ProcedureDiscussionFieldsFragment,
  RiskDiscussionFieldsFragment,
  SubcontrolDiscussionFieldsFragment,
} from '@repo/codegen/src/schema.ts'
import { TComment } from '@repo/ui/components/ui/comment.jsx'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  initialValue?: string | Value
  variant?: TPlateEditorVariants
  styleVariant?: TPlateEditorStyleVariant
  clearData?: boolean
  onClear?: () => void
  placeholder?: string
  entity?: PolicyDiscussionFieldsFragment | ProcedureDiscussionFieldsFragment | RiskDiscussionFieldsFragment | SubcontrolDiscussionFieldsFragment | ControlDiscussionFieldsFragment
  userData?: GetUserProfileQuery
  readonly?: boolean
  isCreate?: boolean
}

export interface PlateEditorRef {
  insertContent: (text: string, clearBeforeInsert?: boolean) => void
  editor: ReturnType<typeof createPlateEditor>
}

const PlateEditor = forwardRef<PlateEditorRef, TPlateEditorProps>(
  ({ onChange, initialValue, variant = 'basic', styleVariant, clearData, onClear, placeholder, entity, userData, readonly, isCreate }, ref) => {
    const editor = usePlateEditor({
      plugins: EditorKitVariant[variant] as unknown as PlatePlugin[],
    })

    const [plateEditor, setPlateEditor] = useState<ReturnType<typeof createPlateEditor> | null>(null)
    const [initialValueSet, setInitialValueSet] = useState(false)

    function mapEntityDiscussions(
      entity: PolicyDiscussionFieldsFragment | ProcedureDiscussionFieldsFragment | RiskDiscussionFieldsFragment | SubcontrolDiscussionFieldsFragment | ControlDiscussionFieldsFragment,
    ): TDiscussion[] {
      return (
        entity.discussions?.edges
          ?.map((edge) => {
            const d = edge?.node
            if (!d || !d.externalID) return null

            const comments: TComment[] =
              d.comments?.edges
                ?.map((cEdge) => {
                  const c = cEdge?.node
                  if (!c) return null

                  return {
                    id: c.id,
                    contentRich: [
                      {
                        type: 'p',
                        children: [{ text: c.text, comment: true, [`comment_${d.externalID}`]: true }],
                        id: c.noteRef,
                      },
                    ],
                    createdAt: new Date(c.createdAt ?? Date.now()),
                    discussionId: d.id,
                    isEdited: c.isEdited,
                    userId: c.createdBy ?? 'unknown',
                  } as TComment
                })
                .filter((c): c is TComment => c !== null) ?? []

            return {
              id: d.externalID,
              systemId: d.id,
              createdAt: new Date(d.createdAt ?? Date.now()),
              isResolved: false,
              userId: comments[0]?.userId ?? 'unknown',
              comments,
            } as TDiscussion
          })
          .filter((d): d is TDiscussion => d !== null) ?? []
      )
    }

    useEffect(() => {
      if (isCreate) {
        editor.setOption(discussionPlugin, 'isCreate', true)
      } else {
        editor.setOption(discussionPlugin, 'isCreate', false)
      }

      if (!editor || !entity || !userData?.user) return

      editor.setOption(discussionPlugin, 'entityType', entity.__typename)
      editor.setOption(discussionPlugin, 'entityId', entity.id)
      editor.setOption(discussionPlugin, 'currentUserId', userData.user.id)

      editor.setOption(discussionPlugin, 'users', {
        [userData.user.id]: {
          id: userData.user.id,
          name: userData.user.displayName,
          avatarUrl: userData.user.avatarRemoteURL ?? '',
        },
      })

      editor.setOption(discussionPlugin, 'discussions', mapEntityDiscussions(entity))
    }, [editor, entity, isCreate, userData])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      insertContent: (text: string, clearBeforeInsert?: boolean) => {
        if (!editor) return

        // Clear existing content if requested
        if (clearBeforeInsert) {
          editor.tf.reset()
        }

        // @ts-expect-error fix bad typing from platejs
        // Deserialize markdown to Slate nodes
        const nodes = (editor.api.markdown?.deserialize?.(text) ?? []) as Value

        // Insert at current selection
        editor.tf.insertNodes(nodes, {
          select: true,
          mode: 'highest',
        })
      },
      editor,
    }))

    useEffect(() => {
      const instance = createPlateEditor({
        plugins: EditorKitVariant[variant] as unknown as PlatePlugin[],
      })
      setPlateEditor(instance)
    }, [variant])

    useEffect(() => {
      if (plateEditor && !initialValueSet) {
        setInitialValueSet(true)

        const fmt = detectFormat(initialValue)
        let slateNodes

        switch (fmt) {
          case 'markdown':
            slateNodes = (plateEditor.api.markdown?.deserialize?.(initialValue || '') ?? []) as Value
            break
          default:
            slateNodes = Array.isArray(initialValue)
              ? initialValue
              : (plateEditor.api.html.deserialize({
                  element: initialValue || '',
                }) as Value)
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
          editor.children = slateNodes
        }
      }
    }, [editor, initialValue, plateEditor, initialValueSet])

    useEffect(() => {
      if (clearData) {
        editor.transforms.reset()
        onClear?.()
      }
    }, [clearData, editor.transforms, onClear])

    return (
      <DndProvider backend={HTML5Backend}>
        <Plate
          readOnly={readonly}
          editor={editor}
          onChange={(data) => {
            onChange?.(data.value)
          }}
        >
          <EditorContainer
            variant={readonly ? 'readonly' : styleVariant}
            onClick={() => {
              // @ts-expect-error fix bad typing from platejs
              editor?.focus()
            }}
          >
            <Editor placeholder={placeholder ?? 'Type a paragraph'} variant={readonly ? 'readonly' : undefined} />
          </EditorContainer>
        </Plate>
      </DndProvider>
    )
  },
)

PlateEditor.displayName = 'PlateEditor'

export default React.memo(PlateEditor)
