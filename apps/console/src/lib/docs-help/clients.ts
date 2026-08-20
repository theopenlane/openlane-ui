// Lazily built Vertex/Gemini/GCS clients, shared by every docs-help mode
import { GoogleGenAI } from '@google/genai'
import { VertexRagServiceClient } from '@google-cloud/aiplatform'
import { Storage } from '@google-cloud/storage'
import { docsHelpEnabled, googleAPIKey, googleProjectID, googleAIRegion, docsAIRegion, docsRagCorpusID } from '@repo/dally/ai'
import type { DocsHelpClients, GoogleServiceAccountCredentials } from '@/lib/docs-help/types'

let clients: DocsHelpClients | null = null
let clientsUnavailable = false

export const getClients = (): DocsHelpClients | null => {
  if (clients || clientsUnavailable) return clients
  if (!docsHelpEnabled || !googleProjectID || !googleAPIKey || !docsRagCorpusID) {
    clientsUnavailable = true
    return null
  }

  try {
    const credentials: GoogleServiceAccountCredentials = JSON.parse(Buffer.from(googleAPIKey, 'base64').toString('utf8'))
    clients = {
      rag: new VertexRagServiceClient({
        project: googleProjectID,
        location: docsAIRegion,
        apiEndpoint: `${docsAIRegion}-aiplatform.googleapis.com`,
        credentials,
      }),
      genAI: new GoogleGenAI({
        vertexai: true,
        project: googleProjectID,
        location: googleAIRegion,
        googleAuthOptions: { credentials },
      }),
      storage: new Storage({ projectId: googleProjectID, credentials }),
    }
    return clients
  } catch (err) {
    console.error('docs-help client init error:', err instanceof Error ? err.message : err)
    clientsUnavailable = true
    return null
  }
}

// where the corpus lives, for retrieveContexts calls
export const corpusLocation = () => {
  const parent = `projects/${googleProjectID}/locations/${docsAIRegion}`
  return { parent, ragCorpus: `${parent}/ragCorpora/${docsRagCorpusID}` }
}

// fetch the full extracted page file from the corpus bucket
export const fetchGcsFile = async (storage: Storage, gsUri: string): Promise<string | null> => {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gsUri)
  if (!match) return null
  try {
    const [buf] = await storage.bucket(match[1]).file(match[2]).download()
    return buf.toString('utf8')
  } catch (err) {
    console.error('docs-help full-page fetch error:', err instanceof Error ? err.message : err)
    return null
  }
}
