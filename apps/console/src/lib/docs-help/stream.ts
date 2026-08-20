// NDJSON framing: chunks are sent as soon as retrieval lands, the summary follows
import type { DocsHelpChunk, DocsHelpFrame } from '@/types/docs-help'

const encoder = new TextEncoder()

export const encodeFrame = (frame: DocsHelpFrame): Uint8Array => encoder.encode(`${JSON.stringify(frame)}\n`)

export const docsHelpStream = (chunks: DocsHelpChunk[], summary: Promise<string>): ReadableStream<Uint8Array> =>
  new ReadableStream({
    async start(controller) {
      controller.enqueue(encodeFrame({ chunks }))

      // the summary is best-effort: if it fails or the client aborted, the
      // retrieved chunks must still reach the panel
      let text = ''
      try {
        text = await summary
      } catch (err) {
        console.error('docs-help summary error:', err instanceof Error ? err.message : err)
      }

      try {
        controller.enqueue(encodeFrame({ summary: text }))
        controller.close()
      } catch {
        controller.error(new Error('docs-help stream closed'))
      }
    },
  })
