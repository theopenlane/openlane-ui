// Lazily built Vertex/Gemini clients, shared by every docs-help mode
import { VertexRagServiceClient } from '@google-cloud/aiplatform'
import { promisify } from 'node:util'
import { gunzip } from 'node:zlib'
import { CRC32C } from '@google-cloud/storage'
import type { gaxios } from 'google-auth-library'
import { docsHelpEnabled, googleProjectID, docsAIRegion, docsRagCorpusID } from '@repo/dally/ai'
import { getGoogleServiceAccountCredentials } from '@/lib/google/credentials'
import { getGoogleAuth } from '@/lib/google/google-auth'
import { getVertexGenAI } from '@/lib/google/vertex-genai'
import { delay } from '@/utils/async'
import type { DocsHelpClients } from '@/lib/docs-help/types'

const GCS_BUCKETS_URL = 'https://storage.googleapis.com/storage/v1/b'
const GCS_DOWNLOAD_DEADLINE_MS = 10_000 // 10s

const GZIP_MAGIC = [0x1f, 0x8b]

const gunzipAsync = promisify(gunzip)

let clients: DocsHelpClients | null = null
let clientsUnavailable = false

export const getClients = (): DocsHelpClients | null => {
  if (clients || clientsUnavailable) return clients
  if (!docsHelpEnabled || !googleProjectID || !docsRagCorpusID) {
    clientsUnavailable = true
    return null
  }

  const credentials = getGoogleServiceAccountCredentials()
  const genAI = getVertexGenAI()
  if (!credentials || !genAI) {
    clientsUnavailable = true
    return null
  }

  try {
    clients = {
      rag: new VertexRagServiceClient({
        project: googleProjectID,
        location: docsAIRegion,
        apiEndpoint: `${docsAIRegion}-aiplatform.googleapis.com`,
        credentials,
      }),
      genAI,
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

const decodeObject = async (headers: Headers, body: Buffer): Promise<string> => {
  const storedEncoding = headers.get('x-goog-stored-content-encoding')
  const isCompressed = headers.get('content-encoding') === 'gzip' && body.length > 1 && body[0] === GZIP_MAGIC[0] && body[1] === GZIP_MAGIC[1]
  if (storedEncoding === 'identity' || (storedEncoding === 'gzip' && isCompressed)) {
    const expected = /(?:^|,)\s*crc32c=([^,]+)/.exec(headers.get('x-goog-hash') ?? '')?.[1]
    const actual = new CRC32C()
    actual.update(body)
    if (!expected || !actual.validate(expected)) throw new Error('storage returned a page whose crc32c does not match')
  }
  const bytes = isCompressed ? await gunzipAsync(body) : body
  return bytes.toString('utf8')
}

// fetch the full extracted page file from the corpus bucket
export const fetchGcsFile = async (gsUri: string, signal?: AbortSignal): Promise<string | null> => {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gsUri)
  if (!match || signal?.aborted) return null

  const deadline = new AbortController()
  const deadlineTimer = setTimeout(() => deadline.abort(new DOMException('GCS page download deadline exceeded', 'AbortError')), GCS_DOWNLOAD_DEADLINE_MS)
  const downloadSignal = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal

  try {
    const options: gaxios.GaxiosOptions & { compress: boolean } = {
      url: `${GCS_BUCKETS_URL}/${encodeURIComponent(match[1])}/o/${encodeURIComponent(match[2])}?alt=media`,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: { 'Accept-Encoding': 'gzip', 'Cache-Control': 'no-store' },
      compress: false,
      signal: downloadSignal,
      retry: true,
      retryConfig: {
        retryBackoff: (_error, delayMs) => delay(delayMs, downloadSignal),
      },
    }
    const response = await getGoogleAuth().request<ArrayBuffer>(options)
    const text = await decodeObject(response.headers, Buffer.from(response.data))
    downloadSignal.throwIfAborted()
    return text
  } catch (err) {
    if (!signal?.aborted) {
      const reason = deadline.signal.aborted ? deadline.signal.reason : err
      console.error('docs-help full-page fetch error:', reason instanceof Error ? reason.message : reason)
    }
    return null
  } finally {
    clearTimeout(deadlineTimer)
  }
}
