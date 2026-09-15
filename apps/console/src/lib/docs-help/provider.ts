import { docsHelpDemo } from '@repo/dally/ai'
import { corpusLocation, fetchGcsFile, getClients } from '@/lib/docs-help/clients'
import { generateControlTitles, generatePublicRepresentation, summarizeChunks } from '@/lib/docs-help/ai'
import { sanitizePrompt } from '@/lib/model-armor/sanitize'
import type { DocsHelpClients, DocsProvider, DocsRetrievedContext } from '@/lib/docs-help/types'

const vertexProvider = (clients: DocsHelpClients): DocsProvider => ({
  retrieve: async (query, options): Promise<DocsRetrievedContext[]> => {
    const { parent, ragCorpus } = corpusLocation()
    const text = await sanitizePrompt(query, options?.signal)
    const { topK } = options ?? {}
    const [response] = await clients.rag.retrieveContexts({
      parent,
      query: topK !== undefined ? { text, ragRetrievalConfig: { topK } } : { text },
      vertexRagStore: { ragResources: [{ ragCorpus }] },
    })
    return (response.contexts?.contexts ?? []).flatMap((context) => (context?.text ? [{ text: context.text, sourceUri: context.sourceUri ?? undefined }] : []))
  },
  pageText: (sourceUri) => fetchGcsFile(clients.storage, sourceUri),
  summarize: (chunks, query, signal) => summarizeChunks(clients.genAI, chunks, query, signal),
  controlTitles: (controls, signal) => generateControlTitles(clients.genAI, controls, signal),
  publicRepresentation: (input, signal) => generatePublicRepresentation(clients.genAI, input, signal),
})

export const getDocsProvider = async (): Promise<DocsProvider | null> => {
  if (docsHelpDemo) return (await import('@/lib/docs-help/demo')).demoDocsProvider

  const clients = getClients()
  return clients ? vertexProvider(clients) : null
}
