'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPlateEditor, Plate } from '@udecode/plate/react'
import { TPlateEditorStyleVariant, TPlateEditorVariants, useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { Value } from '@udecode/plate'
import debounce from 'lodash.debounce'
import { viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

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

const PlateEditor: React.FC<TPlateEditorProps> = ({ onChange, initialValue, variant, styleVariant, clearData, onClear, placeholder, isScrollable }: TPlateEditorProps) => {
  // useCreateEditor hook is used for rendering Rich Text Editor (Inside hook all plugins are being imported)
  const editor = useCreateEditor({ variant: variant })
  const [data, setData] = useState<Value>()

  useMemo(() => {
    if (initialValue) {
      const plateEditor = createPlateEditor({
        plugins: [...viewPlugins],
      })
      // Converts html text into PlateJs readable structure, and editor.children sets default value
      editor.children = plateEditor.api.html.deserialize({ element: initialValue }) as Value
    }
  }, [])

  const updateData = debounce((newData) => {
    setData(newData)
  }, 300)

  useEffect(() => {
    if (data) {
      onChange && onChange(data)
    }
  }, [JSON.stringify(data)])

  useEffect(() => {
    if (clearData) {
      editor.transforms.reset()
      onClear && onClear()
    }
  }, [clearData])

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Plate
          editor={editor}
          onChange={(data) => {
            updateData(data.value)
          }}
        >
          <EditorContainer variant={styleVariant} isScrollable={isScrollable}>
            <Editor placeholder={placeholder ?? 'Type a paragraph'} />
          </EditorContainer>
        </Plate>
      </DndProvider>
    </>
  )
}

export default React.memo(PlateEditor)
