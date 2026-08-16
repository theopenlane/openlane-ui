import { createSlateEditor, ElementApi, KEYS, NodeApi, type SlateEditor, type TElement, type Value } from 'platejs'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'
import { detectFormat } from './usePlateEditor'
import type usePlateEditor from './usePlateEditor'

const deserializeToPlate = (input: string): { editor: SlateEditor; nodes: Value | null } => {
  const editor = createSlateEditor({ plugins: BaseEditorKit })
  const fmt = detectFormat(input)
  const nodes = fmt === 'html' ? editor.api.html?.deserialize?.({ element: input }) : editor.api.markdown?.deserialize?.(input)
  return { editor, nodes: Array.isArray(nodes) && nodes.length > 0 ? (nodes as Value) : null }
}

export const stringToPlateValue = (input: string | null | undefined): Value | null => (input ? deserializeToPlate(input).nodes : null)

export const isPlateValueEmpty = (value: Value | string | undefined | null, editor?: SlateEditor): boolean => {
  if (!value) return true

  const { editor: parsedEditor, nodes } = typeof value === 'string' ? deserializeToPlate(value) : { editor: null, nodes: value }
  if (!nodes || nodes.length === 0) return true
  if (nodes.some((node) => NodeApi.string(node).trim().length > 0)) return false

  const structureEditor = parsedEditor ?? editor ?? createSlateEditor({ plugins: BaseEditorKit })
  structureEditor.children = nodes
  for (const [node] of NodeApi.descendants(structureEditor)) {
    if (!ElementApi.isElement(node)) continue
    if (structureEditor.api.isVoid(node)) return false
    if (node.children.some(ElementApi.isElement)) return false
  }

  return true
}

type TPlateHtmlConverter = Pick<ReturnType<typeof usePlateEditor>, 'convertToHtml'>

export const plateToHtmlOrNull = async (value: Value | string | undefined | null, converter: TPlateHtmlConverter): Promise<string | null> => {
  if (!value || isPlateValueEmpty(value)) {
    return null
  }

  return typeof value === 'string' ? value : converter.convertToHtml(value)
}

const isUntrimmableElement = (editor: SlateEditor, node: TElement): boolean => editor.api.isVoid(node) || node.type === KEYS.codeBlock

const trimEdgeWhitespace = (editor: SlateEditor, block: TElement, side: 'start' | 'end'): void => {
  if (isUntrimmableElement(editor, block)) return
  for (const [node] of NodeApi.descendants(block, { reverse: side === 'end' })) {
    if (ElementApi.isElement(node)) {
      if (isUntrimmableElement(editor, node)) return
      continue
    }
    const trimmedText = side === 'start' ? node.text.replace(/^\s+/, '') : node.text.replace(/\s+$/, '')
    node.text = trimmedText
    if (trimmedText.length > 0) return
  }
}

const pruneEmptyEdgeLeaves = (block: TElement): void => {
  if (block.children.length <= 1) return
  const kept = block.children.filter((child) => ElementApi.isElement(child) || child.text.length > 0)
  if (kept.length > 0) block.children = kept
}

export const trimPlateValue = (value: Value): Value => {
  if (!Array.isArray(value) || value.length === 0) return value
  const editor = createSlateEditor({ plugins: BaseEditorKit })
  let start = 0
  let end = value.length
  while (start < end && isPlateValueEmpty([value[start]], editor)) start++
  while (end > start && isPlateValueEmpty([value[end - 1]], editor)) end--
  const trimmed = value.slice(start, end)
  if (trimmed.length === 0) return trimmed
  const lastIndex = trimmed.length - 1
  trimmed[0] = structuredClone(trimmed[0])
  if (lastIndex > 0) trimmed[lastIndex] = structuredClone(trimmed[lastIndex])
  trimEdgeWhitespace(editor, trimmed[0], 'start')
  trimEdgeWhitespace(editor, trimmed[lastIndex], 'end')
  pruneEmptyEdgeLeaves(trimmed[0])
  pruneEmptyEdgeLeaves(trimmed[lastIndex])
  return trimmed
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
