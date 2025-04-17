'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPlateEditor, Plate } from '@udecode/plate/react'
import { TPlateEditorStyleVariant, TPlateEditorVariants, useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { Value } from '@udecode/plate'
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

  const debouncedOnChange = useRef(
    debounce((val: Value) => {
      onChange?.(val)
    }, 300),
  ).current

  useMemo(() => {
    if (initialValue) {
      const plateEditor = createPlateEditor({
        plugins: [...viewPlugins],
      })
      editor.children = plateEditor.api.html.deserialize({
        element: initialValue,
      }) as Value
    }
  }, [])

  useEffect(() => {
    if (clearData) {
      editor.transforms.reset()
      onClear?.()
    }
  }, [clearData])

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
