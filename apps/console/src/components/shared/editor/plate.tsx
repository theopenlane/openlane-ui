'use client'

import { useEffect } from 'react'

import { createPlateEditor, Plate } from '@udecode/plate-common/react'
import { Value } from '@udecode/plate-common'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { Editor } from '@repo/ui/plate-ui/editor'
import { FixedToolbar } from '@repo/ui/plate-ui/fixed-toolbar'
import { FixedToolbarButtons } from '@repo/ui/plate-ui/fixed-toolbar-buttons'
import { FloatingToolbar } from '@repo/ui/plate-ui/floating-toolbar'
import { FloatingToolbarButtons } from '@repo/ui/plate-ui/floating-toolbar-buttons'

import PlateConfig from './plate-config'

const editor = createPlateEditor(Object.assign({}, PlateConfig, { value: '' }))

type Props = {
  content: Value
  onChange: (content: Value[]) => void
}

export default function PlateEditor({ content, onChange }: Props) {
  useEffect(() => {
    if (content) {
      editor.tf.setValue(content)
    }
  }, [content])

  const handleChange = ({ value }: { value: Value[] }) => {
    onChange(value)
  }

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Plate editor={editor} onChange={handleChange}>
          <FixedToolbar>
            <FixedToolbarButtons />
          </FixedToolbar>

          <Editor variant="fullWidth" placeholder="Type..." />

          <FloatingToolbar>
            <FloatingToolbarButtons />
          </FloatingToolbar>
        </Plate>
      </DndProvider>
    </>
  )
}
