'use client'
import { createSlateEditor, PlateStatic, serializeHtml } from '@udecode/plate-core'
import { Value } from '@udecode/plate-common'
import { staticViewComponents } from '@repo/ui/components/editor/use-create-editor.ts'
import { viewPlugins } from '@repo/ui/components/editor/plugins/editor-plugins.tsx'

const usePlateEditor = () => {
  return {
    convertToHtml: async (data: Value) => {
      if (!data) {
        return ''
      }

      console.log(data)

      const editor = createSlateEditor({
        plugins: [...viewPlugins],
        value: data,
      })

      return await serializeHtml(editor, {
        components: staticViewComponents,
        stripClassNames: true,
        stripDataAttributes: true,
      })
    },
  }
}

export default usePlateEditor
