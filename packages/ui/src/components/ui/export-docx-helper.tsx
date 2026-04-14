'use client'

type SlateNode = {
  type?: string
  children?: SlateNode[]
  text?: string
  [key: string]: any
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '<br />').replace(/\r/g, '<br />')
}

function splitParagraphNewlinesForExport(nodes: SlateNode[]): SlateNode[] {
  return nodes.flatMap((node) => {
    if (node.type === 'p' && Array.isArray(node.children) && node.children.length === 1 && typeof node.children[0]?.text === 'string') {
      const child = node.children[0]
      if (!child.text) {
        return [node]
      }

      const normalized = normalizeLineEndings(child.text)

      if (!normalized.includes('\n')) {
        return [{ ...node, children: [{ ...child, text: normalized }] }]
      }

      return normalized.split('\n').map((line) => ({
        ...node,
        children: [{ ...child, text: line }],
      }))
    }

    return [node]
  })
}

export { splitParagraphNewlinesForExport }
