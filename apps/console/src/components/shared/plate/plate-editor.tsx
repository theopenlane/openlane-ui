'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPlateEditor, Plate } from '@udecode/plate/react'
import { useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { Value } from '@udecode/plate'
import debounce from 'lodash.debounce'
import { viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

export type TPlateEditorProps = {
  onChange?: (data: Value) => void
  initialValue?: string
}

const PlateEditor: React.FC<TPlateEditorProps> = ({ onChange, initialValue }: TPlateEditorProps) => {
  const editor = useCreateEditor()
  const [data, setData] = useState<Value>()

  useMemo(() => {
    if (initialValue) {
      const plateEditor = createPlateEditor({
        plugins: [...viewPlugins],
      })
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

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Plate
          editor={editor}
          onChange={(data) => {
            updateData(data.value)
          }}
        >
          <EditorContainer>
            <Editor variant="demo" />
          </EditorContainer>
        </Plate>
      </DndProvider>
    </>
  )
}

export default React.memo(PlateEditor)
