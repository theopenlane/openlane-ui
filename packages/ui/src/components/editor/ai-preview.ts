import { AI_PREVIEW_KEY, BaseAIPlugin, withAIBatch } from '@platejs/ai'
import { AIChatPlugin, applyAISuggestions } from '@platejs/ai/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { BlockSelectionPlugin } from '@platejs/selection/react'
import { type Descendant, ElementApi, getPluginType, KEYS, NodeApi, PathApi, TextApi } from 'platejs'
import type { PlateEditor } from 'platejs/react'

const withAIMark = (nodes: Descendant[], aiType: string): Descendant[] =>
  nodes.map((node) => (TextApi.isText(node) ? { ...node, [aiType]: true } : { ...node, children: withAIMark(node.children, aiType) }))

export const beginAIInsert = (editor: PlateEditor) => {
  if (!editor.selection) return

  const startPath = editor.selection.focus.path.slice(0, 1)
  const startBlock = editor.children[startPath[0]]
  const startsInEmptyParagraph = startBlock.type === getPluginType(editor, KEYS.p) && NodeApi.string(startBlock).length === 0

  editor.getTransforms(BaseAIPlugin).ai.beginPreview({ originalBlocks: startsInEmptyParagraph ? [startBlock] : [] })
  editor.tf.withoutSaving(() => {
    editor.tf.insertNodes({ children: [{ text: '' }], type: getPluginType(editor, KEYS.aiChat) }, { at: PathApi.next(startPath) })
    if (startsInEmptyParagraph) {
      editor.tf.setNodes({ [AI_PREVIEW_KEY]: true }, { at: startPath })
    }
  })
  editor.setOption(AIChatPlugin, 'streaming', true)
}

export const renderAIInsert = (editor: PlateEditor, content: string) => {
  if (!editor.getOption(AIChatPlugin, 'streaming')) return

  const aiType = getPluginType(editor, KEYS.ai)
  const blocks = editor
    .getApi(MarkdownPlugin)
    .markdown.deserialize(content.replace(/^\s*\n/, '').trimEnd())
    .filter((block) => ElementApi.isElement(block))
    .map((block) => ({ ...block, [AI_PREVIEW_KEY]: true, children: withAIMark(block.children, aiType) }))

  if (blocks.length === 0) return

  editor.tf.withoutSaving(() => {
    editor.tf.withScrolling(() => {
      editor.tf.removeNodes({ at: [], mode: 'highest', match: (node) => ElementApi.isElement(node) && !!node[AI_PREVIEW_KEY] })

      const anchorPath = editor.getApi(AIChatPlugin).aiChat.node({ anchor: true })?.[1]
      if (!anchorPath) return

      editor.tf.insertNodes(blocks, { at: anchorPath, select: true })
      editor.setOption(AIChatPlugin, '_blockPath', [anchorPath[0] + blocks.length - 1])
    })
  })
}

export const applyAIEdit = (editor: PlateEditor, content: string) => {
  const selectedBlocks = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes()
  const selectedRange = selectedBlocks.length === 1 ? editor.api.range(selectedBlocks[0][1]) : undefined
  if (selectedRange) {
    editor.tf.select(selectedRange)
    editor.setOption(AIChatPlugin, 'chatSelection', selectedRange)
  }

  const { children, selection } = editor
  const undoCount = editor.history.undos.length

  try {
    withAIBatch(editor, () => applyAISuggestions(editor, content), { split: true })
    return true
  } catch {
    editor.tf.withoutSaving(() => {
      editor.tf.deselect()
      editor.tf.setValue(children)
      if (selection) editor.tf.select(selection)
    })
    editor.history.undos.length = undoCount
    return false
  }
}
