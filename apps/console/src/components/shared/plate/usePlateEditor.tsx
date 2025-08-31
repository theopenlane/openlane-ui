'use client'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import { EditorStatic } from '@repo/ui/components/ui/editor-static.tsx'
import { createSlateEditor, PlateStatic, serializeHtml, Value } from 'platejs'

type Detected = 'markdown' | 'html' | 'slate-json' | 'text'

export function detectFormat(input: unknown): Detected {
  if (typeof input !== 'string') return 'text'
  const s = input.trim()

  // Slate JSON
  if (s.startsWith('[')) {
    try {
      const v = JSON.parse(s)
      if (Array.isArray(v) && v.every((n) => n && typeof n === 'object' && 'children' in n)) {
        return 'slate-json'
      }
    } catch {
      // Silent fail - not valid JSON, continue with format detection
    }
  }

  // Quick HTML vs MD heuristics
  const mdScore = (/^#{1,6}\s/m.test(s) ? 1 : 0) + (/^\s{0,3}[-*+]\s+/m.test(s) ? 1 : 0) + (/^\s{0,3}\d+\.\s+/m.test(s) ? 1 : 0) + (/```[\s\S]*?```/m.test(s) ? 1 : 0)
  const htmlScore = (/<\/?(?:p|div|span|ul|ol|li|h[1-6]|table|tr|td|a|strong|em|br|hr|img)\b/i.test(s) ? 2 : 0) + (/<\/\w+>/.test(s) ? 1 : 0)

  if (mdScore >= 2 && mdScore >= htmlScore) return 'markdown'
  if (htmlScore >= 2 && htmlScore > mdScore) return 'html'
  if (mdScore === 1 && htmlScore === 0) return 'markdown'
  if (htmlScore === 1 && mdScore === 0) return 'html'

  return 'text'
}

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

      const fmt = detectFormat(data)

      switch (fmt) {
        case 'markdown':
          return await editor.api.markdown?.serialize?.()
        default:
          return await serializeHtml(editor, {
            editorComponent: EditorStatic,
            stripClassNames: false,
            stripDataAttributes: false,
          })
      }
    },
    // Converts html data into deserializable PlateJs value, and rendering read only static view
    convertToReadOnly: (data: string, padding: number = 0, style?: React.CSSProperties) => {
      const editor = createSlateEditor({
        plugins: [...BaseEditorKit],
      })

      const fmt = detectFormat(data)
      let nodes

      switch (fmt) {
        case 'markdown':
          nodes = editor.api.markdown?.deserialize?.(data)
          break
        default:
          nodes = editor.api.html?.deserialize?.({ element: data })
      }

      editor.children = nodes as Value

      const finalStyle = style ? style! : { padding }

      return <PlateStatic editor={editor} style={finalStyle} className="plate-static" />
    },
  }
}

export default usePlateEditor
