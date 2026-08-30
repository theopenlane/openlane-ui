import { getCommentCount, getDraftCommentKey } from '@platejs/comment'
import { type Descendant, type TCommentText, type Value, KEYS, TextApi } from 'platejs'

const draftCommentKey = getDraftCommentKey()

const stripText = (text: TCommentText): TCommentText => {
  if (!(draftCommentKey in text)) return text

  const stripped = { ...text }
  delete stripped[draftCommentKey]

  if (getCommentCount(stripped) === 0) {
    delete stripped[KEYS.comment]
  }

  return stripped
}

const stripNode = (node: Descendant): Descendant => {
  if (TextApi.isText(node)) return stripText(node)
  if (!Array.isArray(node.children)) return node

  const children = node.children.map(stripNode)

  return children.every((child, index) => child === node.children[index]) ? node : { ...node, children }
}

export const stripDraftCommentMarks = (value: Value): Value => {
  const stripped = value.map(stripNode) as Value

  return stripped.every((node, index) => node === value[index]) ? value : stripped
}
