import { createDemoDocsProvider } from '@/lib/docs-help/demo'
import { dedupeBySource, extractMarkdownSection, parseChunk, parseDocBullets, parsePolicyMappingTable, rankChunks } from '@/lib/docs-help/parse'
import { parseFaq } from '@/components/shared/docs-help/docs-faq'
import { lookupSection } from '@/lib/docs-help/retrieval'

const demoDocsProvider = createDemoDocsProvider(0, 0)

const topChunkFor = async (query: string, prefer?: string) => {
  const contexts = await demoDocsProvider.retrieve(query)
  return rankChunks(dedupeBySource(contexts.map((context) => context.text)), prefer, 'platform')[0]
}

const pageFor = async (query: string, prefer?: string) => {
  const contexts = await demoDocsProvider.retrieve(query)
  const top = rankChunks(dedupeBySource(contexts.map((context) => context.text)), prefer, 'platform')[0]
  const sourceUri = contexts.find((context) => parseChunk(context.text).source === top.source)?.sourceUri
  const stored = sourceUri ? await demoDocsProvider.pageText(sourceUri) : null
  return { top, text: stored ? parseChunk(stored).text : '' }
}

describe('demo retrieval', () => {
  it('finds the page a route topic asks for', async () => {
    expect((await topChunkFor('how to create a control', 'Writing Controls')).title).toBe('Writing Controls')
    expect((await topChunkFor('controls overview', 'Controls Overview')).title).toBe('Controls Overview')
    expect((await topChunkFor('members groups and roles overview')).title).toBe('Members, Groups and Roles')
    expect((await topChunkFor('authentication and single sign-on overview')).title).toBe('Authentication')
  })

  it('matches a framework control by its ref code', async () => {
    const top = await topChunkFor('SOC 2 CC6.1', 'CC6.1')
    expect(top.title.toLowerCase()).toContain('cc6.1')
  })

  it('never returns an empty result', async () => {
    const contexts = await demoDocsProvider.retrieve('zzzqqq')
    expect(contexts.length).toBeGreaterThan(0)
    expect(contexts.every((context) => context.sourceUri)).toBe(true)
  })

  it('returns a windowed chunk with the whole page behind it', async () => {
    const { top, text } = await pageFor('SOC 2 CC6.1', 'CC6.1')
    expect(text.startsWith(top.text)).toBe(true)
  })
})

describe('demo pages feed the section extractors', () => {
  it('has the sections the control detail views pull out', async () => {
    const { text } = await pageFor('SOC 2 CC6.1', 'CC6.1')

    expect(extractMarkdownSection(text, ['Evidence Requests', 'Evidence Request'])).toBeTruthy()
    expect(extractMarkdownSection(text, 'Example Evidence')).toBeTruthy()

    const policies = parseDocBullets(extractMarkdownSection(text, 'Policies') ?? '')
    expect(policies.length).toBeGreaterThan(0)
    expect(policies[0].label).toBe('Access Control Policy')

    const objectives = parseDocBullets(extractMarkdownSection(text, 'Example Control Objectives') ?? '')
    expect(objectives.length).toBeGreaterThan(0)
    expect(objectives[0].description).toBeTruthy()
  })

  it('parses an FAQ out of a topic page', async () => {
    const { text } = await pageFor('controls overview', 'Controls Overview')
    const faq = parseFaq(extractMarkdownSection(text, ['Frequently Asked Questions', 'FAQs', 'FAQ']) ?? '')
    expect(faq.length).toBeGreaterThan(0)
    expect(faq[0].question.endsWith('?')).toBe(true)
    expect(faq[0].answer).toBeTruthy()
  })

  it('parses the policy to framework mapping table', async () => {
    const { text } = await pageFor('policies to framework mapping', 'policy-framework-mapping')
    const mapping = parsePolicyMappingTable(text)

    expect(mapping.find((row) => row.policy === 'Information Security Policy')?.frameworks).toEqual(['all'])
    expect(mapping.find((row) => row.policy === 'Access Control Policy')?.frameworks).toContain('SOC 2')
  })
})

describe('demo generation', () => {
  it('summarizes from the retrieved chunks', async () => {
    const contexts = await demoDocsProvider.retrieve('controls overview')
    const chunks = dedupeBySource(contexts.map((context) => context.text))
    const summary = await demoDocsProvider.summarize(chunks, 'controls overview', new AbortController().signal)

    expect(summary).toContain('Demo summary')
    expect(summary.length).toBeGreaterThan(40)
  })

  it('returns nothing to summarize when retrieval found nothing', async () => {
    expect(await demoDocsProvider.summarize([], 'anything', new AbortController().signal)).toBe('')
  })

  it('names a control from its description, positionally', async () => {
    const titles = await demoDocsProvider.controlTitles([{ refCode: 'AC-1', description: 'The organization restricts access to production systems to approved personnel.' }, { refCode: 'AC-2' }])

    expect(titles).toHaveLength(2)
    expect(titles[0].split(' ').length).toBeLessThanOrEqual(8)
    expect(titles[0]).toBe('Organization Restricts Access to Production Systems')
    expect(titles[1]).toBe('')
  })

  it('drafts a public representation from the material it is given', async () => {
    const text = await demoDocsProvider.publicRepresentation({
      refCode: 'CC6.1',
      referenceFramework: 'SOC 2',
      description: 'Access is granted on approval and removed when no longer needed.',
      implementations: ['Reviews production access quarterly with the system owner.'],
      objectives: ['Access is removed within one business day of departure.'],
    })

    expect(text).toContain('The organization reviews production access quarterly')
    expect(text).toContain('SOC 2 CC6.1')
  })

  it('sizes the draft against the whole description, not just its first sentence', async () => {
    const text = await demoDocsProvider.publicRepresentation({
      refCode: 'CC6.1',
      referenceFramework: 'SOC 2',
      description:
        'Access is granted on approval and removed when no longer needed. Requests are recorded with the approver and the business reason. Privileged access is reviewed on a defined schedule and revoked when a role changes.',
      implementations: ['Reviews production access quarterly with the system owner.'],
      objectives: ['Access is removed within one business day of departure.'],
    })

    expect(text).toContain('Effectiveness is measured by whether')
    expect(text).toContain('Supporting evidence is retained')
  })

  it('does not double the subject when the implementation already has one', async () => {
    const text = await demoDocsProvider.publicRepresentation({
      refCode: 'CC6.1',
      referenceFramework: 'SOC 2',
      implementations: ['The organization reviews production access quarterly.'],
    })

    expect(text).not.toContain('The organization the organization')
    expect(text).toContain('The organization reviews production access quarterly.')
  })
})

describe('the batch section lookup runs on demo data', () => {
  it('resolves each row to its named section', async () => {
    const rows = [
      { query: 'SOC 2 CC7.2', prefer: 'CC7.2', extractSection: ['Evidence Requests', 'Evidence Request'] },
      { query: 'ISO 27001 A.5.15', prefer: 'A.5.15', extractSection: 'Policies' },
    ]

    const results = await Promise.all(rows.map((row) => lookupSection(demoDocsProvider, row, 'platform')))

    expect(results[0].title).toContain('CC7.2')
    expect(results[0].section).toContain('logging and monitoring policy')
    expect(results[1].title).toContain('A.5.15')
    expect(parseDocBullets(results[1].section)[0].label).toBe('Access Control Policy')
  })

  it('returns an empty section when the page has no such heading', async () => {
    const result = await lookupSection(demoDocsProvider, { query: 'SOC 2 CC6.6', prefer: 'CC6.6', extractSection: 'Nonexistent Heading' }, 'platform')
    expect(result.section).toBe('')
    expect(result.source).toBeTruthy()
  })
})
