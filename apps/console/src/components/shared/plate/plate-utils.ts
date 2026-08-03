import { createSlateEditor, ElementApi, NodeApi, type SlateEditor, type Value } from 'platejs'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import { detectFormat } from './usePlateEditor'

const deserializeToPlate = (input: string): { editor: SlateEditor; nodes: Value | null } => {
  const editor = createSlateEditor({ plugins: BaseEditorKit })
  const fmt = detectFormat(input)
  const nodes = fmt === 'html' ? editor.api.html?.deserialize?.({ element: input }) : editor.api.markdown?.deserialize?.(input)
  return { editor, nodes: Array.isArray(nodes) && nodes.length > 0 ? (nodes as Value) : null }
}

export const stringToPlateValue = (input: string | null | undefined): Value | null => (input ? deserializeToPlate(input).nodes : null)

export const isPlateValueEmpty = (value: Value | string | undefined | null): boolean => {
  if (!value) return true

  const { editor, nodes } = typeof value === 'string' ? deserializeToPlate(value) : { editor: null, nodes: value }
  if (!nodes || nodes.length === 0) return true
  if (nodes.some((node) => NodeApi.string(node).trim().length > 0)) return false

  const structureEditor = editor ?? createSlateEditor({ plugins: BaseEditorKit })
  structureEditor.children = nodes
  for (const [node] of NodeApi.descendants(structureEditor)) {
    if (!ElementApi.isElement(node)) continue
    if (structureEditor.api.isVoid(node)) return false
    if (node.children.some(ElementApi.isElement)) return false
  }

  return true
}

// Produces a canonical JSON string for Plate content comparison.
// Strips comment marks and sorts object keys so the result is stable
// regardless of key ordering or comment additions.
export const canonicalizeDetails = (nodes: Value): string => {
  const normalize = (val: unknown): unknown => {
    if (val === null || typeof val !== 'object') return val
    if (Array.isArray(val)) return val.map(normalize)
    const obj = val as Record<string, unknown>
    return Object.keys(obj)
      .filter((k) => k !== 'comment' && k !== 'commentTransient' && !k.startsWith('comment_'))
      .sort()
      .reduce(
        (acc: Record<string, unknown>, k) => {
          acc[k] = normalize(obj[k])
          return acc
        },
        {} as Record<string, unknown>,
      )
  }
  return JSON.stringify(normalize(nodes))
}

export const hasPlaceholderText = (value: Value | string | undefined | null): boolean => {
  if (!value) return false
  const text = typeof value === 'string' ? value : Array.isArray(value) ? value.map((node) => NodeApi.string(node)).join('') : ''
  return /\{\{.*?\}\}/.test(text)
}
