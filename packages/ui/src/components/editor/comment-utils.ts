import { getCommentCount, getCommentKey, getDraftCommentKey, getTransientCommentKey } from '@platejs/comment'
import { type Descendant, type TCommentText, type Value, KEYS, TextApi } from 'platejs'

const UNSAVED_KEYS = [getDraftCommentKey(), getTransientCommentKey()]

const stripText = (text: TCommentText, unsavedKeys: string[]): TCommentText => {
  const presentKeys = unsavedKeys.filter((key) => key in text)
  if (presentKeys.length === 0) return text

  const stripped = { ...text }
  presentKeys.forEach((key) => delete stripped[key])

  if (getCommentCount(stripped) === 0) {
    delete stripped[KEYS.comment]
  }

  return stripped
}

const stripNode = (node: Descendant, unsavedKeys: string[]): Descendant => {
  if (TextApi.isText(node)) return stripText(node, unsavedKeys)
  if (!Array.isArray(node.children)) return node

  const children = node.children.map((child) => stripNode(child, unsavedKeys))

  return children.every((child, index) => child === node.children[index]) ? node : { ...node, children }
}

export const stripUnsavedCommentMarks = (value: Value, unsavedDiscussions: { id: string }[] = []): Value => {
  const unsavedKeys = [...UNSAVED_KEYS, ...unsavedDiscussions.map((discussion) => getCommentKey(discussion.id))]
  const stripped = value.map((node) => stripNode(node, unsavedKeys)) as Value

  return stripped.every((node, index) => node === value[index]) ? value : stripped
}
