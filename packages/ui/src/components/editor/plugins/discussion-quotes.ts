import { getCommentKeyId, getCommentKeys, getDraftCommentKey, isCommentText } from '@platejs/comment'
import { ElementApi, type Descendant, type Value } from 'platejs'

export const collectDiscussionQuotes = (value: Value | null | undefined): Map<string, string> => {
  const quotes = new Map<string, string>()
  const draftKey = getDraftCommentKey()

  const visit = (node: Descendant) => {
    if (ElementApi.isElement(node)) {
      node.children.forEach(visit)
      return
    }
    if (!isCommentText(node)) return
    getCommentKeys(node)
      .filter((key) => key !== draftKey)
      .forEach((key) => {
        const id = getCommentKeyId(key)
        quotes.set(id, `${quotes.get(id) ?? ''}${node.text}`)
      })
  }

  value?.forEach(visit)
  return quotes
}
