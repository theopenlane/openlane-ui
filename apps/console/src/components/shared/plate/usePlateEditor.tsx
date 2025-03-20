'use client'
import { createSlateEditor, PlateStatic, serializeHtml } from '@udecode/plate-core'
import { Value } from '@udecode/plate-common'
import { staticViewComponents } from '@repo/ui/components/editor/use-create-editor.ts'
import { basePlugins, viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

const usePlateEditor = () => {
  return {
    convertToHtml: async (data: Value) => {
      if (!data) {
        return ''
      }

      const editor = createSlateEditor({
        plugins: [...basePlugins],
        value: data,
      })

      return await serializeHtml(editor, {
        components: staticViewComponents,
        stripClassNames: false,
        stripDataAttributes: false,
      })
    },
    convertToReadOnly: (data: string) => {
      const editor = createSlateEditor({
        plugins: [...basePlugins],
      })

      editor.children = editor.api.html.deserialize({ element: data }) as Value

      return <PlateStatic editor={editor} components={staticViewComponents} style={{ padding: 16 }} className="plate-static" />
    },
  }
}

export default usePlateEditor
