'use client'

import React, { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { Plate } from '@udecode/plate/react'

import { staticViewComponents, useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { SettingsDialog } from '@repo/ui/components/editor/settings.tsx'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { Value } from '@udecode/plate'
import debounce from 'lodash.debounce'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

export type TPlateEditorProps<T extends FieldValues> = {
  field?: ControllerRenderProps<T, Path<T>>
  onChange?: (data: string) => void
}

const PlateEditor = <T extends FieldValues>({ field, onChange }: TPlateEditorProps<T>) => {
  const editor = useCreateEditor()
  const helper = usePlateEditor()
  const [data, setData] = useState<Value>()
  const updateData = debounce((newData) => {
    setData(newData)
  }, 300)

  useEffect(() => {
    if (data) {
      helper.convertToHtml(data).then((htmlData) => {
        field && field.onChange(htmlData)
        onChange && onChange(htmlData)
      })
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
          <SettingsDialog />
        </Plate>
      </DndProvider>
    </>
  )
}

export default PlateEditor
