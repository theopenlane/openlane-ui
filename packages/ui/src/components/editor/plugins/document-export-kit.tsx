'use client'

import { createPlatePlugin } from 'platejs/react'

export const DEFAULT_EXPORT_TITLE = 'Document'

export const documentExportPlugin = createPlatePlugin({
  key: 'document-export',
  options: {
    title: DEFAULT_EXPORT_TITLE,
    onExportPdf: null as (() => void) | null,
  },
})

export const DocumentExportKit = [documentExportPlugin]
