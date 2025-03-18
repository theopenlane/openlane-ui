import { createSlateEditor, serializeHtml } from '@udecode/plate-core'
import { Value } from '@udecode/plate-common'
import { staticViewComponents } from '@repo/ui/components/editor/use-create-editor.ts'
import { EditorStatic } from '@repo/ui/components/plate-ui/editor-static.tsx'

const usePlateEditor = () => {
  return {
    convertToHtml: async (data: Value) => {
      if (!data) {
        return ''
      }

      const editor = createSlateEditor({
        value: data,
      })

      return await serializeHtml(editor, {
        components: staticViewComponents,
        stripClassNames: true,
        stripDataAttributes: true,
        editorComponent: EditorStatic,
      })
    },
  }
}

export default usePlateEditor
