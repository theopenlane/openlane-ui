'use client'

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Value, TElement, KEYS } from 'platejs'
import { EditorKitVariant, TPlateEditorVariants } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer, TPlateEditorStyleVariant } from '@repo/ui/components/ui/editor.tsx'
import { createPlateEditor, Plate, PlatePlugin, usePlateEditor } from 'platejs/react'
import { detectFormat } from './usePlateEditor'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  initialValue?: string
  variant?: TPlateEditorVariants
  styleVariant?: TPlateEditorStyleVariant
  clearData?: boolean
  onClear?: () => void
  placeholder?: string
}

export interface PlateEditorRef {
  insertContent: (text: string, clearBeforeInsert?: boolean) => void
  editor: ReturnType<typeof createPlateEditor>
}

const PlateEditor = forwardRef<PlateEditorRef, TPlateEditorProps>(({ onChange, initialValue, variant = 'basic', styleVariant, clearData, onClear, placeholder }, ref) => {
  const editor = usePlateEditor({
    plugins: EditorKitVariant[variant] as unknown as PlatePlugin[],
  })
  const [plateEditor, setPlateEditor] = useState<ReturnType<typeof createPlateEditor> | null>(null)
  const [initialValueSet, setInitialValueSet] = useState(false)

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
        editor={editor}
        onChange={(data) => {
          onChange?.(data.value)
        }}
      >
        <EditorContainer
          variant={styleVariant}
          onClick={() => {
            // @ts-expect-error fix bad typing from platejs
            editor?.focus()
          }}
        >
          <Editor placeholder={placeholder ?? 'Type a paragraph'} />
        </EditorContainer>
      </Plate>
    </DndProvider>
  )
})

PlateEditor.displayName = 'PlateEditor'

export default React.memo(PlateEditor)
