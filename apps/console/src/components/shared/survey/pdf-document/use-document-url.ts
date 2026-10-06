'use client'

import { useEffect, useState } from 'react'
import { PDF_MIME_TYPE } from '@/components/shared/file-preview/preview-mime'

type TEmbeddedUrlState = { status: 'pending' } | { status: 'ready'; url: string } | { status: 'failed' }

export const useDocumentUrl = (source: string): { documentUrl: string | null; decodeFailed: boolean } => {
  const isEmbedded = source.startsWith('data:')
  const [embedded, setEmbedded] = useState<TEmbeddedUrlState>({ status: 'pending' })

  useEffect(() => {
    if (!isEmbedded) return
    const controller = new AbortController()
    let objectUrl: string | null = null

    fetch(source, { signal: controller.signal })
      .then((response) => response.arrayBuffer())
      .then(
        (buffer) => {
          if (controller.signal.aborted) return
          objectUrl = URL.createObjectURL(new Blob([buffer], { type: PDF_MIME_TYPE }))
          setEmbedded({ status: 'ready', url: objectUrl })
        },
        () => {
          if (!controller.signal.aborted) setEmbedded({ status: 'failed' })
        },
      )

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isEmbedded, source])

  if (!isEmbedded) return { documentUrl: source, decodeFailed: false }
  return { documentUrl: embedded.status === 'ready' ? embedded.url : null, decodeFailed: embedded.status === 'failed' }
}
