'use client'
import { createSlateEditor, PlateStatic, serializeHtml } from '@udecode/plate-core'
import { Value } from '@udecode/plate-common'
import { staticViewComponents } from '@repo/ui/components/editor/use-create-editor.ts'
import { basePlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

const usePlateEditor = () => {
  return {
    convertToHtml: async (data: Value) => {
      // Converts PlateJs data format into serializable html which we can save in database
      if (!data) {
        return ''
      }

      const editor = createSlateEditor({
        plugins: [...basePlugins],
        value: data,
      })
      console.log(editor)

      return await serializeHtml(editor, {
        components: staticViewComponents,
        stripClassNames: false,
        stripDataAttributes: false,
      })
    },
    // Converts html data into deserializable PlateJs value, and rendering read only static view
    convertToReadOnly: (data: string, padding: number = 16, style?: React.CSSProperties) => {
      const editor = createSlateEditor({
        plugins: [...basePlugins],
      })

      editor.children = editor.api.html.deserialize({ element: data }) as Value

      const finalStyle = style ? style! : { padding }

      return <PlateStatic editor={editor} components={staticViewComponents} style={finalStyle} className="plate-static" />
    },
  }
}

export default usePlateEditor
