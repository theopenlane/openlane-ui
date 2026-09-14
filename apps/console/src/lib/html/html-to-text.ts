const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'caption',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'legend',
  'li',
  'main',
  'nav',
  'ol',
  'option',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  bull: '•',
  cent: '¢',
  copy: '©',
  deg: '°',
  euro: '€',
  gt: '>',
  hellip: '…',
  laquo: '«',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  middot: '·',
  nbsp: ' ',
  ndash: '–',
  pound: '£',
  quot: '"',
  raquo: '»',
  rdquo: '”',
  reg: '®',
  rsquo: '’',
  sect: '§',
  times: '×',
  trade: '™',
  yen: '¥',
}

const HAS_CLOSING_TAG = /<\/[a-zA-Z][^\s>]*\s*>/

const HAS_EMBEDDED = /<\/(?:script|style)\s*>/i

const EMBEDDED = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi

const MARKUP = /<!--[\s\S]*?-->|<![^>]*>|<\?[\s\S]*?\?>|<\/?([a-zA-Z][^\s/>]*)(?:"[^"]*"|'[^']*'|[^>"'])*>/g

const ENTITY = /&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g

const LINE_BREAKS = /\r\n?|[\u2028\u2029]/g

const INLINE_SPACE = /[^\S\n]+/g

const ALL_WHITESPACE = /\s+/g

const fromCodePoint = (code: number): string | undefined => (Number.isInteger(code) && code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : undefined)

const decodeEntity = (entity: string): string | undefined => {
  if (entity[0] !== '#') return NAMED_ENTITIES[entity]

  return fromCodePoint(entity[1] === 'x' || entity[1] === 'X' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1)))
}

const stripMarkup = (value: string): string =>
  (HAS_EMBEDDED.test(value) ? value.replace(EMBEDDED, '') : value).replace(MARKUP, (_markup, tagName: string | undefined) => (tagName && BLOCK_TAGS.has(tagName.toLowerCase()) ? '\n' : ''))

const decodeEntities = (value: string): string => value.replace(ENTITY, (match, entity: string) => decodeEntity(entity) ?? match)

const collapseWhitespace = (value: string): string =>
  value
    .replace(LINE_BREAKS, '\n')
    .replace(INLINE_SPACE, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')

export const htmlToText = (value: string): string => (HAS_CLOSING_TAG.test(value) ? collapseWhitespace(decodeEntities(stripMarkup(value))) : value)

export const htmlToInlineText = (value: string): string => htmlToText(value).replace(ALL_WHITESPACE, ' ').trim()
