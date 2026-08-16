import { createSlatePlugin, TextApi, type NodeEntry, type TText } from 'platejs'
import { TemplatePlaceholderLeaf } from '../../ui/template-placeholder-node'
import { TemplatePlaceholderLeafStatic } from '../../ui/template-placeholder-node-static'

// {{ like this }}, left behind by a control or policy template
const PLACEHOLDER = /\{\{.*?\}\}/g

export const TEMPLATE_PLACEHOLDER_KEY = 'templatePlaceholder'

// Marks template placeholders wherever text is rendered, so a description
// adopted from a template shows what still needs filling in
const decoratePlaceholders = ({ entry: [node, path] }: { entry: NodeEntry }) => {
  if (!TextApi.isText(node)) return undefined

  const text = (node as TText).text
  if (!text) return undefined

  const ranges = [...text.matchAll(PLACEHOLDER)].map((match) => ({
    anchor: { path, offset: match.index },
    focus: { path, offset: match.index + match[0].length },
    [TEMPLATE_PLACEHOLDER_KEY]: true,
  }))

  return ranges.length > 0 ? ranges : undefined
}

export const TemplatePlaceholderPlugin = createSlatePlugin({
  key: TEMPLATE_PLACEHOLDER_KEY,
  node: { isLeaf: true, component: TemplatePlaceholderLeaf },
  decorate: decoratePlaceholders,
})

// the readonly view renders through the static editor, which needs a slate leaf
export const BaseTemplatePlaceholderPlugin = createSlatePlugin({
  key: TEMPLATE_PLACEHOLDER_KEY,
  node: { isLeaf: true, component: TemplatePlaceholderLeafStatic },
  decorate: decoratePlaceholders,
})

export const TemplatePlaceholderKit = [TemplatePlaceholderPlugin]
export const BaseTemplatePlaceholderKit = [BaseTemplatePlaceholderPlugin]
