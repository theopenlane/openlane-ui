'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPlateEditor, Plate } from '@udecode/plate/react'
import { useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { Value } from '@udecode/plate'
import debounce from 'lodash.debounce'
import { viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

export type TPlateEditorProps<T extends FieldValues> = {
  field?: ControllerRenderProps<T, Path<T>>
  onChange?: (data: Value) => void
}

const PlateEditor = <T extends FieldValues>({ field, onChange }: TPlateEditorProps<T>) => {
  const editor = useCreateEditor()
  const [data, setData] = useState<Value>()

  useMemo(() => {
    if (field?.value) {
      const plateEditor = createPlateEditor({
        plugins: [...viewPlugins],
      })
      editor.children = plateEditor.api.html.deserialize({ element: field.value }) as Value
    }
  }, [])

  const updateData = debounce((newData) => {
    setData(newData)
  }, 2000)

  useEffect(() => {
    if (data) {
      field && field.onChange(data)
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
