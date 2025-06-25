import type { FileRouter } from 'uploadthing/next'

import { createRouteHandler, createUploadthing } from 'uploadthing/next'

const f = createUploadthing()

const ourFileRouter = {
  editorUploader: f(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
    .middleware(() => {
      return {}
    })
    .onUploadComplete(async (opts) => {
      return {
        ...opts.file,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})
