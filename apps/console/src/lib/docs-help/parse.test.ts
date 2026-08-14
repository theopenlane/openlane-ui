import { dedupeBySource, extractMarkdownSection, isDocsHomepage, looksTruncated, parseChunk, parseDocBullets, parsePolicyMappingTable, qualifyTitle, rankChunks, stripInlineMarkdown } from './parse'

const chunk = (title: string, source: string, text = 'body text.') => `Title: ${title}\nSource: ${source}\n\n${text}`

describe('qualifyTitle', () => {
  it('prefixes generic titles with their parent section', () => {
    expect(qualifyTitle('Overview', 'https://docs.theopenlane.io/docs/platform/trust-center/overview')).toBe('Trust Center Overview')
  })

  it('preserves acronyms in the parent segment', () => {
    expect(qualifyTitle('Overview', 'https://docs.theopenlane.io/docs/platform/standards/nist-csf/overview')).toBe('NIST CSF Overview')
  })

  it('leaves specific titles alone', () => {
    expect(qualifyTitle('Frameworks', 'https://docs.theopenlane.io/docs/platform/trust-center/frameworks')).toBe('Frameworks')
  })

  it('does not prefix with a structural segment', () => {
    expect(qualifyTitle('Overview', 'https://docs.theopenlane.io/docs/platform/overview')).toBe('Overview')
  })

  it('tolerates a malformed source', () => {
    expect(qualifyTitle('Overview', 'not-a-url')).toBe('Overview')
  })
})

describe('isDocsHomepage', () => {
  it('matches the site root and the docs root', () => {
    expect(isDocsHomepage('https://docs.theopenlane.io/')).toBe(true)
    expect(isDocsHomepage('https://docs.theopenlane.io/docs')).toBe(true)
  })

  it('does not match a content page', () => {
    expect(isDocsHomepage('https://docs.theopenlane.io/docs/platform/overview')).toBe(false)
  })

  it('is false for empty or malformed input', () => {
    expect(isDocsHomepage('')).toBe(false)
    expect(isDocsHomepage('not-a-url')).toBe(false)
  })
})

describe('stripInlineMarkdown', () => {
  it('unwraps links and drops bold markers', () => {
    expect(stripInlineMarkdown('**[Access Control](https://example.com)**')).toBe('Access Control')
  })
})

describe('parseDocBullets', () => {
  it('reads label and description from doc bullets', () => {
    const section = ['* **Access Control Policy** - who may reach what', '- **Backup Policy** — how data is retained'].join('\n')
    expect(parseDocBullets(section)).toEqual([
      { label: 'Access Control Policy', description: 'who may reach what' },
      { label: 'Backup Policy', description: 'how data is retained' },
    ])
  })

  it('strips inline markdown from both halves', () => {
    expect(parseDocBullets('* **[A1.1](https://example.com)** - Backups are **tested**')).toEqual([{ label: 'A1.1', description: 'Backups are tested' }])
  })

  it('ignores lines that are not bullets', () => {
    expect(parseDocBullets('Some prose about policies.')).toEqual([])
  })
})

describe('looksTruncated', () => {
  it('flags a dangling list marker', () => {
    expect(looksTruncated('1. first\n2. second\n3.')).toBe(true)
  })

  it('flags an unfinished sentence', () => {
    expect(looksTruncated('The control operates when')).toBe(true)
  })

  it('accepts terminal punctuation', () => {
    expect(looksTruncated('The control operates monthly.')).toBe(false)
  })

  it('accepts a table row ending in a pipe', () => {
    expect(looksTruncated('| Policy | Frameworks |')).toBe(false)
  })

  it('is false for empty text', () => {
    expect(looksTruncated('   ')).toBe(false)
  })
})

describe('parseChunk', () => {
  it('splits headers from body and drops the site suffix', () => {
    const parsed = parseChunk(chunk('Frameworks | Openlane', 'https://docs.theopenlane.io/docs/platform/trust-center/frameworks'))
    expect(parsed.title).toBe('Frameworks')
    expect(parsed.source).toBe('https://docs.theopenlane.io/docs/platform/trust-center/frameworks')
    expect(parsed.text).toBe('body text.')
  })

  it('strips images from the body', () => {
    const parsed = parseChunk(chunk('T', 'https://docs.theopenlane.io/docs/platform/x', '![alt](img.png) after.'))
    expect(parsed.text).toBe('after.')
  })

  it('marks a cut-off chunk as truncated', () => {
    expect(parseChunk(chunk('T', 'https://docs.theopenlane.io/docs/platform/x', 'ends abruptly')).truncated).toBe(true)
  })
})

describe('dedupeBySource', () => {
  it('keeps one chunk per source and skips the homepage', () => {
    const chunks = dedupeBySource([
      chunk('A', 'https://docs.theopenlane.io/docs/platform/a'),
      chunk('A again', 'https://docs.theopenlane.io/docs/platform/a'),
      chunk('Home', 'https://docs.theopenlane.io/docs'),
      chunk('B', 'https://docs.theopenlane.io/docs/platform/b'),
      null,
    ])
    expect(chunks.map((entry) => entry.title)).toEqual(['A', 'B'])
  })
})

describe('rankChunks', () => {
  const platform = chunk('Platform Overview', 'https://docs.theopenlane.io/docs/platform/overview')
  const developers = chunk('Architecture', 'https://docs.theopenlane.io/docs/developers/architecture')
  const frameworks = chunk('Frameworks', 'https://docs.theopenlane.io/docs/platform/trust-center/frameworks')

  it('promotes the page named by prefer', () => {
    const ranked = rankChunks(dedupeBySource([platform, frameworks]), 'frameworks', 'platform')
    expect(ranked[0].title).toBe('Frameworks')
  })

  it('biases toward the section being viewed', () => {
    const ranked = rankChunks(dedupeBySource([developers, platform]), undefined, 'platform')
    expect(ranked[0].title).toBe('Platform Overview')
  })

  it('keeps the original order when nothing scores', () => {
    const ranked = rankChunks(dedupeBySource([developers, platform]), undefined, 'developers')
    expect(ranked[0].title).toBe('Architecture')
  })
})

describe('extractMarkdownSection', () => {
  const page = ['## Evidence Requests', 'ask for logs', '', '## Example Evidence', 'a screenshot', '', '# Other', 'unrelated'].join('\n')

  it('returns a named section up to the next heading', () => {
    expect(extractMarkdownSection(page, 'Evidence Requests')).toBe('ask for logs')
  })

  it('tries names in the order given', () => {
    expect(extractMarkdownSection(page, ['Example Evidence', 'Evidence Requests'])).toBe('a screenshot')
  })

  it('matches a heading that carries a trailing anchor', () => {
    const withAnchor = '## FAQ[​](https://docs.theopenlane.io/x#faq "Direct link")\nan answer.'
    expect(extractMarkdownSection(withAnchor, ['FAQ'])).toBe('an answer.')
  })

  it('returns null when absent', () => {
    expect(extractMarkdownSection(page, 'Nonexistent')).toBeNull()
  })
})

describe('parsePolicyMappingTable', () => {
  it('reads policies and their frameworks, skipping the header', () => {
    const table = ['| Policy | Frameworks |', '| --- | --- |', '| **[Access Control](/x)** | SOC 2, ISO 27001 |', '| Business Continuity | all |'].join('\n')
    expect(parsePolicyMappingTable(table)).toEqual([
      { policy: 'Access Control', frameworks: ['SOC 2', 'ISO 27001'] },
      { policy: 'Business Continuity', frameworks: ['all'] },
    ])
  })
})
