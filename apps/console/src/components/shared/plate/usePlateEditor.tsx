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
  // Markdown regex patterns
  const MD_HEADING_RE = /^#{1,6}\s/m
  const MD_ULIST_RE = /^\s{0,3}[-*+]\s+/m
  const MD_OLIST_RE = /^\s{0,3}\d+\.\s+/m
  const MD_CODEBLOCK_RE = /```[\s\S]*?```/m

  // HTML regex patterns
  const HTML_TAGS_RE = /<\/?(?:p|div|span|ul|ol|li|h[1-6]|table|tr|td|a|strong|em|br|hr|img)\b/i
  const HTML_GENERIC_CLOSE_RE = /<\/\w+>/

  function hasMarkdownHeading(str: string): boolean {
    return MD_HEADING_RE.test(str)
  }
  function hasMarkdownUList(str: string): boolean {
    return MD_ULIST_RE.test(str)
  }
  function hasMarkdownOList(str: string): boolean {
    return MD_OLIST_RE.test(str)
  }
  function hasMarkdownCodeBlock(str: string): boolean {
    return MD_CODEBLOCK_RE.test(str)
  }
  function hasHtmlTags(str: string): boolean {
    return HTML_TAGS_RE.test(str)
  }
  function hasHtmlGenericClose(str: string): boolean {
    return HTML_GENERIC_CLOSE_RE.test(str)
  }

  const mdScore = (hasMarkdownHeading(s) ? 1 : 0) + (hasMarkdownUList(s) ? 1 : 0) + (hasMarkdownOList(s) ? 1 : 0) + (hasMarkdownCodeBlock(s) ? 1 : 0)

  const htmlScore = (hasHtmlTags(s) ? 2 : 0) + (hasHtmlGenericClose(s) ? 1 : 0)
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
    convertToReadOnly: (data: string | Value, padding: number = 0, style?: React.CSSProperties) => {
      const editor = createSlateEditor({
        plugins: [...BaseEditorKit],
      })
      const finalStyle = style ? style! : { padding }

      const fmt = detectFormat(data)
      let nodes = []

      if (Array.isArray(data)) {
        editor.children = data
        return <PlateStatic editor={editor} style={finalStyle} className="plate-static" />
      }

      switch (fmt) {
        case 'markdown':
          nodes = editor.api.markdown?.deserialize?.(data)
          break
        default:
          nodes = editor.api.html?.deserialize?.({ element: data })
      }

      editor.children = nodes as Value

      return <PlateStatic editor={editor} style={finalStyle} className="plate-static" />
    },
  }
}

export default usePlateEditor
