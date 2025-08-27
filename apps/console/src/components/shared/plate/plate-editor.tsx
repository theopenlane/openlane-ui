'use client'

import React, { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Value, TElement } from 'platejs'
import { EditorKitVariant, TPlateEditorVariants } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer, TPlateEditorStyleVariant } from '@repo/ui/components/ui/editor.tsx'
import { createPlateEditor, Plate, PlatePlugin, usePlateEditor } from 'platejs/react'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  initialValue?: string
  variant?: TPlateEditorVariants
  styleVariant?: TPlateEditorStyleVariant
  clearData?: boolean
  onClear?: () => void
  placeholder?: string
}

const PlateEditor: React.FC<TPlateEditorProps> = ({ onChange, initialValue, variant = 'basic', styleVariant, clearData, onClear, placeholder }) => {
  const editor = usePlateEditor({
    plugins: EditorKitVariant[variant] as unknown as PlatePlugin[],
  })
  const [plateEditor, setPlateEditor] = useState<ReturnType<typeof createPlateEditor> | null>(null)
  const [initialValueSet, setInitialValueSet] = useState(false)

  useEffect(() => {
    const instance = createPlateEditor({
      plugins: EditorKitVariant[variant] as unknown as PlatePlugin[],
    })
    setPlateEditor(instance)
  }, [variant])

  useEffect(() => {
    if (plateEditor && !initialValueSet) {
      setInitialValueSet(true)
      const slateNodes = Array.isArray(initialValue)
        ? initialValue
        : (plateEditor.api.html.deserialize({
            element: initialValue || '',
          }) as Value)

      if (Array.isArray(slateNodes) && slateNodes.length === 1 && typeof (slateNodes[0] as TElement).text === 'string' && !(slateNodes[0] as TElement).type) {
        editor.children = [
          {
            type: 'p',
            children: slateNodes as Value,
          },
        ]
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
        <EditorContainer variant={styleVariant}>
          <Editor placeholder={placeholder ?? 'Type a paragraph'} />
        </EditorContainer>
      </Plate>
    </DndProvider>
  )
}

export default React.memo(PlateEditor)
