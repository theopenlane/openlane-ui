import { type Value, type TElement, KEYS } from 'platejs'

const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeNode = (node: any): string => {
  if (node?.type === KEYS.mention && typeof node.value === 'string') {
    return node.key ? `@[${node.value}](${node.key})` : `@${node.value}`
  }
  if (typeof node?.text === 'string') {
    return node.text
  }
  if (Array.isArray(node?.children)) {
    return node.children.map(serializeNode).join('')
  }
  return ''
}

export const serializeCommentValue = (value: Value): string => value.map(serializeNode).join('\n')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseCommentTextToChildren = (text: string, textMarks: Record<string, unknown> = {}): any[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []
  MENTION_PATTERN.lastIndex = 0
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    const [, displayName, userId] = match
    if (match.index > lastIndex) {
      children.push({ text: text.slice(lastIndex, match.index), ...textMarks })
    }
    children.push({
      type: KEYS.mention,
      value: displayName,
      key: userId,
      children: [{ text: '' }],
    })
    lastIndex = MENTION_PATTERN.lastIndex
  }

  if (lastIndex < text.length) {
    children.push({ text: text.slice(lastIndex), ...textMarks })
  }

  if (children.length === 0) {
    children.push({ text: '', ...textMarks })
  }

  return children
}

export const parseCommentText = (text: string, id?: string | null, textMarks: Record<string, unknown> = {}): TElement =>
  ({
    type: 'p',
    children: parseCommentTextToChildren(text, textMarks),
    ...(id ? { id } : {}),
  }) as TElement
