'use client'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import { EditorStatic } from '@repo/ui/components/ui/editor-static.tsx'
import { createSlateEditor, PlateStatic, serializeHtml, Value } from 'platejs'

const usePlateEditor = () => {
  return {
    convertToHtml: async (data: Value) => {
      // Converts PlateJs data format into serializable html which we can save in database
      if (!data) {
        return ''
      }

      const editor = createSlateEditor({
        plugins: BaseEditorKit,
        value: data,
      })

      return await serializeHtml(editor, {
        editorComponent: EditorStatic,
        stripClassNames: false,
        stripDataAttributes: false,
      })
    },
    // Converts html data into deserializable PlateJs value, and rendering read only static view
    convertToReadOnly: (data: string, padding: number = 0, style?: React.CSSProperties) => {
      const editor = createSlateEditor({
        plugins: [...BaseEditorKit],
      })

      editor.children = editor.api.html.deserialize({ element: data }) as Value

      const finalStyle = style ? style! : { padding }

      return <PlateStatic editor={editor} style={finalStyle} className="plate-static" />
    },
  }
}

export default usePlateEditor
