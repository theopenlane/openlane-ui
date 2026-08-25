import { docsHelpDemo } from '@repo/dally/ai'
import { corpusLocation, fetchGcsFile, getClients } from '@/lib/docs-help/clients'
import { generateControlTitles, generatePublicRepresentation, summarizeChunks } from '@/lib/docs-help/ai'
import type { DocsHelpClients, DocsProvider, DocsRetrievedContext } from '@/lib/docs-help/types'

const vertexProvider = (clients: DocsHelpClients): DocsProvider => ({
  retrieve: async (query, topK): Promise<DocsRetrievedContext[]> => {
    const { parent, ragCorpus } = corpusLocation()
    const [response] = await clients.rag.retrieveContexts({
      parent,
      query: topK !== undefined ? { text: query, ragRetrievalConfig: { topK } } : { text: query },
      vertexRagStore: { ragResources: [{ ragCorpus }] },
    })
    return (response.contexts?.contexts ?? []).flatMap((context) => (context?.text ? [{ text: context.text, sourceUri: context.sourceUri ?? undefined }] : []))
  },
  pageText: (sourceUri) => fetchGcsFile(clients.storage, sourceUri),
  summarize: (chunks, query, signal) => summarizeChunks(clients.genAI, chunks, query, signal),
  controlTitles: (controls) => generateControlTitles(clients.genAI, controls),
  publicRepresentation: (input) => generatePublicRepresentation(clients.genAI, input),
})

export const getDocsProvider = async (): Promise<DocsProvider | null> => {
  if (docsHelpDemo) return (await import('@/lib/docs-help/demo')).demoDocsProvider

  const clients = getClients()
  return clients ? vertexProvider(clients) : null
}
