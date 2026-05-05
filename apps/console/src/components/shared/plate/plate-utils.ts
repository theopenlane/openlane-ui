import { createSlateEditor, type Value } from 'platejs'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import { detectFormat } from './usePlateEditor'

/**
 * Checks if a PlateJS Value is effectively empty.
 * PlateJS always maintains at least one paragraph node. When the editor is
 * "empty", it contains a single paragraph whose only child has text that is
 * either truly empty or contains only the zero-width no-break space (U+FEFF)
 * that PlateJS uses as a cursor anchor.
 */
export const isPlateValueEmpty = (value: Value | string | undefined | null): boolean => {
  if (!value) return true
  if (typeof value === 'string') return value.trim().length === 0

  if (!Array.isArray(value)) return true
  if (value.length === 0) return true
  if (value.length > 1) return false

  const firstNode = value[0]
  if (!firstNode || typeof firstNode !== 'object') return true

  const children = (firstNode as Record<string, unknown>).children as Array<Record<string, unknown>> | undefined
  if (!children || children.length === 0) return true
  if (children.length > 1) return false

  const text = children[0]?.text
  if (typeof text !== 'string') return false

  return text.replace(/\uFEFF/g, '').trim().length === 0
}

export const stringToPlateValue = (input: string | null | undefined): Value | null => {
  if (!input) return null
  const editor = createSlateEditor({ plugins: BaseEditorKit })
  const fmt = detectFormat(input)
  const nodes = fmt === 'html' ? editor.api.html?.deserialize?.({ element: input }) : editor.api.markdown?.deserialize?.(input)
  return Array.isArray(nodes) && nodes.length > 0 ? (nodes as Value) : null
}
