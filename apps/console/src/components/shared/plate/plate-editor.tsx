'use client'

import React, { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPlateEditor, Plate } from '@udecode/plate/react'
import { TPlateEditorStyleVariant, TPlateEditorVariants, useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { TElement, Value } from '@udecode/plate'
import { viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'
import debounce from 'lodash.debounce'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  initialValue?: string
  variant?: TPlateEditorVariants
  styleVariant?: TPlateEditorStyleVariant
  isScrollable?: boolean
  clearData?: boolean
  onClear?: () => void
  placeholder?: string
}

const PlateEditor: React.FC<TPlateEditorProps> = ({ onChange, initialValue, variant, styleVariant, clearData, onClear, placeholder, isScrollable }) => {
  const editor = useCreateEditor({ variant })
  const [plateEditor, setPlateEditor] = useState<ReturnType<typeof createPlateEditor> | null>(null)
  const [initialValueSet, setInitialValueSet] = useState(false)

  const debouncedOnChange = useState(() =>
    debounce((val: Value) => {
      onChange?.(val)
    }, 300),
  )[0]

  useEffect(() => {
    const instance = createPlateEditor({
      plugins: [...viewPlugins],
    })
    setPlateEditor(instance)
  }, [])

  useEffect(() => {
    if (plateEditor && !initialValueSet) {
      setInitialValueSet(true)
      const slateNodes = plateEditor.api.html.deserialize({
        element: initialValue || '',
      }) as Value

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
          debouncedOnChange(data.value)
        }}
      >
        <EditorContainer variant={styleVariant} isScrollable={isScrollable}>
          <Editor placeholder={placeholder ?? 'Type a paragraph'} />
        </EditorContainer>
      </Plate>
    </DndProvider>
  )
}

export default React.memo(PlateEditor)
