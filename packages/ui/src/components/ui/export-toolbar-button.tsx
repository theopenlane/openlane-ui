'use client'

import * as React from 'react'

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu'

import { exportEditorToDocx, exportToDocx } from '@platejs/docx-io'
import { MarkdownPlugin } from '@platejs/markdown'
import { ArrowDownToLineIcon } from 'lucide-react'
import { createSlateEditor } from 'platejs'
import { useEditorRef } from 'platejs/react'
import { serializeHtml } from 'platejs/static'
import { splitParagraphNewlinesForExport } from './export-docx-helper'

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'

import { EditorStatic } from './editor-static'
import { ToolbarButton } from '../ui/toolbar'
import { DocxExportKit } from '@repo/ui/components/editor/plugins/docx-export-kit.tsx'
import { DocxKit } from '../editor/plugins/docx-kit'

const siteUrl = 'https://platejs.org'

const getExportFilename = (title: string, ext: string) => {
  const date = new Date().toISOString().slice(0, 10)
  return `${title}-${date}.${ext}`
}

export function ExportToolbarButton({ title = 'document', ...props }: DropdownMenuProps & { title?: string }) {
  const editor = useEditorRef()
  const [open, setOpen] = React.useState(false)

  const getCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas-pro')

    const style = document.createElement('style')
    document.head.append(style)

    const canvas = await html2canvas(editor.api.toDOMNode(editor)!, {
      onclone: (document: Document) => {
        const editorElement = document.querySelector('[contenteditable="true"]')
        if (editorElement) {
          Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
            const existingStyle = element.getAttribute('style') || ''
            element.setAttribute('style', `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`)
          })
        }
      },
    })
    style.remove()

    return canvas
  }

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url)

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl)
  }

  const exportToPdf = async () => {
    const canvas = await getCanvas()

    const PDFLib = await import('pdf-lib')
    const pdfDoc = await PDFLib.PDFDocument.create()
    const page = pdfDoc.addPage([canvas.width, canvas.height])
    const imageEmbed = await pdfDoc.embedPng(canvas.toDataURL('PNG'))
    const { height, width } = imageEmbed.scale(1)
    page.drawImage(imageEmbed, {
      height,
      width,
      x: 0,
      y: 0,
    })
    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true })

    await downloadFile(pdfBase64, getExportFilename(title, 'pdf'))
  }

  const exportToImage = async () => {
    const canvas = await getCanvas()
    await downloadFile(canvas.toDataURL('image/png'), getExportFilename(title, 'png'))
  }

  const exportToHtml = async () => {
    const editorStatic = createSlateEditor({
      plugins: BaseEditorKit,
      value: editor.children,
    })

    const editorHtml = await serializeHtml(editorStatic, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } },
    })

    const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`
    const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        ${tailwindCss}
        ${katexCss}
        <style>
          :root {
            --font-sans: 'Inter', 'Inter Fallback';
            --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback';
          }
        </style>
      </head>
      <body>
        ${editorHtml}
      </body>
    </html>`

    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`

    await downloadFile(url, getExportFilename(title, 'html'))
  }

  const exportToMarkdown = async () => {
    const md = editor.getApi(MarkdownPlugin).markdown.serialize()
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`
    await downloadFile(url, getExportFilename(title, 'md'))
  }

  const exportToWord = async () => {
    const cleanedChildren = splitParagraphNewlinesForExport(editor.children)

    await exportEditorToDocx(cleanedChildren, getExportFilename(title, 'docx'), {
      editorPlugins: [...BaseEditorKit, ...DocxKit, ...DocxExportKit],
      editorStaticComponent: EditorStatic,
      title: title,
    })

    console.log('Exported Word document')
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Export" isDropdown>
          <ArrowDownToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToHtml}>Export as HTML</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>Export as PDF</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>Export as Image</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>Export as Markdown</DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToWord}>Export as Word</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
