import { auth } from '@/lib/auth/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BATCH_CONCURRENCY, MAX_BATCH_ITEMS, MAX_PREFER_CHARS, MAX_QUERY_CHARS } from '@/lib/docs-help/constants'
import { corpusLocation, getClients, fetchGcsFile } from '@/lib/docs-help/clients'
import { dedupeBySource, extractMarkdownSection, parseChunk, parsePolicyMappingTable, rankChunks } from '@/lib/docs-help/parse'
import { generateControlTitles, generatePublicRepresentation, summarizeChunks } from '@/lib/docs-help/ai'
import { lookupSection } from '@/lib/docs-help/retrieval'
import { cacheKeyOf, readSectionCache, writeSectionCache } from '@/lib/docs-help/section-cache'
import { docsHelpStream } from '@/lib/docs-help/stream'
import { mapWithConcurrency } from '@/utils/async'
import type { DocsHelpChunk } from '@/types/docs-help'

export const runtime = 'nodejs'
export const maxDuration = 30

const requestSchema = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_CHARS).optional(),
  prefer: z.string().trim().max(MAX_PREFER_CHARS).optional(),
  section: z.enum(['platform', 'developers']).optional(),
  summarize: z.boolean().optional(),
  extractSection: z.union([z.string(), z.array(z.string())]).optional(),
  policyMapping: z.boolean().optional(),
  suggestTitles: z.array(z.object({ refCode: z.string().optional(), description: z.string().optional() })).optional(),
  suggestPublicRepresentation: z
    .object({
      refCode: z.string().optional(),
      referenceFramework: z.string().optional(),
      description: z.string().optional(),
      implementations: z.array(z.string()).max(20).optional(),
      objectives: z.array(z.string()).max(20).optional(),
      existing: z.string().optional(),
    })
    .optional(),
  fullPageFor: z.string().optional(),
  batch: z
    .array(
      z.object({
        key: z.string(),
        query: z.string().trim().min(1).max(MAX_QUERY_CHARS),
        prefer: z.string().trim().max(MAX_PREFER_CHARS).optional(),
        extractSection: z.union([z.string(), z.array(z.string())]),
      }),
    )
    .max(MAX_BATCH_ITEMS)
    .optional(),
})

export const POST = async (req: NextRequest) => {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docsClients = getClients()
  if (!docsClients) {
    return NextResponse.json({ error: 'Docs help is not enabled' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { query, prefer, section, summarize, extractSection, policyMapping, suggestTitles, suggestPublicRepresentation, fullPageFor, batch } = parsed.data

  if (suggestPublicRepresentation) {
    return NextResponse.json({ text: await generatePublicRepresentation(docsClients.genAI, suggestPublicRepresentation) })
  }

  if (suggestTitles) {
    if (suggestTitles.length === 0) return NextResponse.json({ titles: [] })
    return NextResponse.json({ titles: await generateControlTitles(docsClients.genAI, suggestTitles) })
  }

  const { parent, ragCorpus } = corpusLocation()

  if (batch) {
    try {
      const results = await mapWithConcurrency(batch, BATCH_CONCURRENCY, async (lookup) => ({
        key: lookup.key,
        ...(await lookupSection(docsClients, parent, ragCorpus, lookup, section)),
      }))
      return NextResponse.json({ results })
    } catch (err) {
      console.error('docs-help batch error:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'Failed to retrieve docs' }, { status: 500 })
    }
  }

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  if (extractSection && query) {
    const cached = readSectionCache(cacheKeyOf({ query, prefer, extractSection }, section))
    if (cached) return NextResponse.json(cached)
  }

  try {
    const wantsWholePage = !!extractSection || !!policyMapping || !!fullPageFor
    const [ragResponse] = await docsClients.rag.retrieveContexts({
      parent,
      query: { text: query },
      vertexRagStore: { ragResources: [{ ragCorpus }] },
    })

    const contexts = ragResponse.contexts?.contexts ?? []
    const chunks = rankChunks(dedupeBySource(contexts.map((context) => context?.text)), prefer, section)

    if (wantsWholePage) {
      const gsUriBySource = new Map<string, string>()
      const allChunks: DocsHelpChunk[] = []
      for (const context of contexts) {
        if (!context?.text) continue
        const chunk = parseChunk(context.text)
        allChunks.push(chunk)
        if (chunk.source && context.sourceUri?.startsWith('gs://')) gsUriBySource.set(chunk.source, context.sourceUri)
      }

      const pageTextFor = async (source: string): Promise<string> => {
        const gsUri = gsUriBySource.get(source)
        const stored = gsUri ? await fetchGcsFile(docsClients.storage, gsUri) : null
        if (stored) return parseChunk(stored).text
        return allChunks
          .filter((chunk) => chunk.source === source)
          .map((chunk) => chunk.text)
          .join('\n\n')
      }

      if (fullPageFor) return NextResponse.json({ text: await pageTextFor(fullPageFor) })

      const top = chunks[0]
      if (!top?.source) return NextResponse.json(policyMapping ? { mapping: [], source: '' } : { section: '', title: '', source: '' })

      const pageText = await pageTextFor(top.source)
      if (policyMapping) return NextResponse.json({ mapping: parsePolicyMappingTable(pageText), source: top.source })
      if (extractSection) {
        const result = { section: extractMarkdownSection(pageText, extractSection) ?? '', title: top.title, source: top.source }
        writeSectionCache(cacheKeyOf({ query, prefer, extractSection }, section), result)
        return NextResponse.json(result)
      }
      return NextResponse.json({ section: '', title: top.title, source: top.source })
    }

    const summary = summarize ? summarizeChunks(docsClients.genAI, chunks, query, req.signal) : Promise.resolve('')

    return new Response(docsHelpStream(chunks, summary), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('docs-help error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to retrieve docs' }, { status: 500 })
  }
}
