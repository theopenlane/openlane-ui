'use client'

import { createPlatePlugin } from 'platejs/react'

/**
 * pdfExportPlugin
 *
 * Holds the callback used to export the current document to PDF via the
 * backend export job, set per-editor through the PlateEditor `onExportPdf` prop
 * When no callback is provided the editor's export menu hides the PDF option
 */
export const pdfExportPlugin = createPlatePlugin({
  key: 'pdf-export',
  options: {
    onExportPdf: null as (() => void) | null,
  },
})

export const PdfExportKit = [pdfExportPlugin]
