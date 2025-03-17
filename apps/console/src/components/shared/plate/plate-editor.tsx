'use client'

import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { Plate } from '@udecode/plate/react'

import { useCreateEditor } from '@repo/ui/components/editor/use-create-editor.ts'
import { SettingsDialog } from '@repo/ui/components/editor/settings.tsx'
import { Editor, EditorContainer } from '@repo/ui/components/plate-ui/editor.tsx'

const PlateEditor = () => {
  const editor = useCreateEditor()

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor}>
        <EditorContainer>
          <Editor variant="demo" />
        </EditorContainer>

        <SettingsDialog />
      </Plate>
    </DndProvider>
  )
}

export default PlateEditor
