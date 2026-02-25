export type HighlightSegment = {
  text: string
  isMatch: boolean
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const splitTextByQuery = (text: string, query: string): HighlightSegment[] => {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return [{ text, isMatch: false }]
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig')
  const parts = text.split(regex)

  return parts.flatMap((part, index) => {
    if (!part) return []
    return [{ text: part, isMatch: index % 2 === 1 }]
  })
}
