// Context-aware docs retrieval for the "need help here" slideout returns the most relevant doc
// sections for a topic, each with its source URL
import { auth } from '@/lib/auth/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { VertexRagServiceClient } from '@google-cloud/aiplatform'
import { aiEnabled, googleAPIKey, googleProjectID, googleAIRegion, docsAIRegion, docsRagCorpusID, geminiModelName, temperature } from '@repo/dally/ai'

export const runtime = 'nodejs'
export const maxDuration = 30

let ragClient: VertexRagServiceClient | null = null
let genAI: GoogleGenAI | null = null
if (aiEnabled && googleProjectID && googleAPIKey) {
  const creds = JSON.parse(Buffer.from(googleAPIKey, 'base64').toString('utf8'))
  ragClient = new VertexRagServiceClient({
    project: googleProjectID,
    location: docsAIRegion,
    apiEndpoint: `${docsAIRegion}-aiplatform.googleapis.com`,
    credentials: creds,
  })

  genAI = new GoogleGenAI({
    vertexai: true,
    project: googleProjectID,
    location: googleAIRegion,
    googleAuthOptions: { credentials: creds },
  })
}

const SUMMARY_INSTRUCTION =
  'Summarize what the documentation excerpts say about the topic in 2-3 plain sentences aimed at a product user. ' +
  'Use ONLY the provided excerpts; never add information that is not in them. ' +
  'Partial coverage is fine — summarize what the excerpts do say about the topic. ' +
  'Only if the excerpts are entirely unrelated to the topic, respond with exactly NO_ANSWER.'

export type DocsHelpChunk = { title: string; source: string; text: string }

const GENERIC_TITLES = /^(overview|introduction|faq|getting started|index)$/i

function qualifyTitle(title: string, source: string): string {
  if (!GENERIC_TITLES.test(title) || !source) return title
  try {
    const segments = new URL(source).pathname.split('/').filter(Boolean)
    const parent = segments[segments.length - 2]
    if (!parent || ['docs', 'platform', 'developers'].includes(parent)) return title
    const parentTitle = parent.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
    return `${parentTitle} ${title}`
  } catch {
    return title
  }
}

function isDocsHomepage(source: string): boolean {
  if (!source) return false
  try {
    const path = new URL(source).pathname.replace(/\/+$/, '')
    return path === '' || path === '/docs'
  } catch {
    return false
  }
}

function parseChunk(raw: string): DocsHelpChunk {
  // drop the site-name suffix from page titles ("Risk Management | Openlane")
  const rawTitle = (raw.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? '').replace(/\s*\|\s*Openlane\s*$/, '')
  const source = raw.match(/^Source:\s*(\S+)$/m)?.[1]?.trim() ?? ''
  const title = qualifyTitle(rawTitle, source)
  const text = raw
    .replace(/^Title:.*$/m, '')
    .replace(/^Source:.*$/m, '')
    .replace(/!\[[^\]]*\]\(\S*\)?/g, '')
    .trim()
  return { title, source, text }
}

export async function POST(req: NextRequest) {
  if (!ragClient || !docsRagCorpusID) {
    return NextResponse.json({ error: 'Docs help is not enabled' }, { status: 503 })
  }

  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { query, prefer, summarize, section } = await req.json()
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const parent = `projects/${googleProjectID}/locations/${docsAIRegion}`
  const ragCorpus = `${parent}/ragCorpora/${docsRagCorpusID}`

  try {
    const [resp] = await ragClient.retrieveContexts({
      parent,
      query: { text: query },
      vertexRagStore: { ragResources: [{ ragCorpus }] },
    })

    // dedupe by source so one long page doesn't fill the panel with several chunks
    const seen = new Set<string>()
    const chunks: DocsHelpChunk[] = []
    for (const c of resp.contexts?.contexts ?? []) {
      if (!c?.text) continue
      const parsed = parseChunk(c.text)

      // skip homepage as relevant doc
      if (isDocsHomepage(parsed.source)) continue

      const key = parsed.source || parsed.text.slice(0, 60)

      if (seen.has(key)) continue

      seen.add(key)
      chunks.push(parsed)
    }

    // re-rank: an explicit prefer hint is deliberate curation and wins outright;
    // otherwise bias toward the doc source matching the console area — product
    // docs for platform screens, developer docs for Developer-area screens
    const p = typeof prefer === 'string' ? prefer.toLowerCase() : ''
    const biasPath = section === 'developers' ? '/docs/developers/' : '/docs/platform/'
    const score = (c: DocsHelpChunk) => {
      let s = 0
      if (p && (c.title.toLowerCase().includes(p) || c.source.toLowerCase().includes(p))) s += 4
      if (c.source.includes(biasPath)) s += 2
      return s
    }
    chunks.sort((a, b) => score(b) - score(a))

    if (!summarize) {
      return NextResponse.json({ chunks })
    }

    // short AI summary, constrained to the retrieved excerpts; the raw
    // sections always ship alongside (from the non-summarize call) so users
    // can verify
    let summary = ''
    if (genAI && chunks.length > 0) {
      try {
        const context = chunks
          .slice(0, 4)
          .map((c) => `# ${c.title}\n${c.text}`)
          .join('\n\n')
          .slice(0, 12000)
        const resp = await genAI.models.generateContent({
          model: geminiModelName,
          contents: [{ role: 'user', parts: [{ text: `Documentation excerpts:\n\n${context}\n\nTopic: ${query}` }] }],
          config: {
            systemInstruction: SUMMARY_INSTRUCTION,
            temperature,
            maxOutputTokens: 300,
            thinkingConfig: { thinkingBudget: 0 },
          },
        })
        const text = resp.text?.trim() ?? ''
        if (text && !text.includes('NO_ANSWER')) summary = text
      } catch (err) {
        // summary is best-effort; retrieval results are still useful without it
        console.error('docs-help summary error:', err instanceof Error ? err.message : err)
      }
    }

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('docs-help error:', err)
    return NextResponse.json({ error: 'Failed to retrieve docs' }, { status: 500 })
  }
}
