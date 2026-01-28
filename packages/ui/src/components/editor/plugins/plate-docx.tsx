import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, ExternalHyperlink } from 'docx'
import { saveAs } from 'file-saver'

type SlateText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

type SlateNode = any
type Value = SlateNode[]

/** Map common heading schemas to a numeric level */
function getHeadingLevel(node: any): 1 | 2 | 3 | 4 | 5 | 6 | null {
  if (!node?.type) return null

  if (/^h[1-6]$/.test(node.type)) return Number(node.type[1]) as any

  const map: Record<string, number> = {
    'heading-one': 1,
    'heading-two': 2,
    'heading-three': 3,
    'heading-four': 4,
    'heading-five': 5,
    'heading-six': 6,
  }
  if (map[node.type]) return map[node.type] as any

  if (node.type === 'heading' && typeof node.level === 'number') {
    return Math.min(Math.max(node.level, 1), 6) as any
  }

  return null
}

function headingLevelToDocx(level: 1 | 2 | 3 | 4 | 5 | 6): HeadingLevel {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1
    case 2:
      return HeadingLevel.HEADING_2
    case 3:
      return HeadingLevel.HEADING_3
    case 4:
      return HeadingLevel.HEADING_4
    case 5:
      return HeadingLevel.HEADING_5
    case 6:
      return HeadingLevel.HEADING_6
  }
}

function isLeaf(n: any): n is SlateText {
  return n && typeof n.text === 'string'
}

function leafToRuns(leaf: SlateText): TextRun[] {
  return [
    new TextRun({
      text: leaf.text,
      bold: !!leaf.bold,
      italics: !!leaf.italic,
      underline: leaf.underline ? {} : undefined,
    }),
  ]
}

/**
 * Convert children (leaves + inline nodes) into docx runs.
 * For unknown inline nodes, we try to recurse into children.
 */
function childrenToRuns(children: any[]): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = []

  for (const child of children ?? []) {
    if (isLeaf(child)) {
      out.push(...leafToRuns(child))
      continue
    }

    // Common Plate link shape: { type: "link", url, children:[...] }
    if ((child.type === 'link' || child.type === 'a') && child.url) {
      const linkRuns: TextRun[] = []
      for (const gc of child.children ?? []) {
        if (isLeaf(gc)) linkRuns.push(...leafToRuns(gc))
        else if (gc?.children) {
          // flatten nested inlines
          const nested = childrenToRuns(gc.children).filter((x): x is TextRun => x instanceof TextRun)
          linkRuns.push(...nested)
        }
      }

      out.push(
        new ExternalHyperlink({
          link: child.url,
          children: linkRuns.length ? linkRuns : [new TextRun({ text: child.url })],
        }),
      )
      continue
    }

    // fallback: recurse children
    if (child?.children) out.push(...childrenToRuns(child.children))
  }

  return out
}

/** Render a node into an array of docx "block" elements */
function nodeToBlocks(node: any): Array<Paragraph | Table> {
  const heading = getHeadingLevel(node)
  if (heading) {
    return [
      new Paragraph({
        heading: headingLevelToDocx(heading),
        children: childrenToRuns(node.children) as any,
      }),
    ]
  }

  switch (node.type) {
    case 'p':
    case 'paragraph':
      return [
        new Paragraph({
          children: childrenToRuns(node.children) as any,
        }),
      ]

    case 'bulleted-list': {
      // children are list-items
      const blocks: Paragraph[] = []
      for (const li of node.children ?? []) {
        blocks.push(...listItemToParagraphs(li))
      }
      return blocks
    }

    case 'list-item':
      return listItemToParagraphs(node)

    case 'table':
      return [tableNodeToTable(node)]

    default: {
      // Fallback: try to render children as paragraphs
      if (node?.children?.length) {
        // If it's a wrapper node, flatten its children into blocks
        const blocks: Array<Paragraph | Table> = []
        for (const child of node.children) blocks.push(...nodeToBlocks(child))
        return blocks
      }
      return []
    }
  }
}

function listItemToParagraphs(li: any): Paragraph[] {
  // Plate list-items often contain paragraphs as children.
  // We'll convert each paragraph into a bulleted paragraph.
  const out: Paragraph[] = []

  const children = li.children ?? []
  const paragraphs = children.filter((c: any) => c.type === 'p' || c.type === 'paragraph')

  if (paragraphs.length) {
    for (const p of paragraphs) {
      out.push(
        new Paragraph({
          bullet: { level: 0 },
          children: childrenToRuns(p.children) as any,
        }),
      )
    }
    return out
  }

  // Fallback: single bullet with whatever inline content exists
  out.push(
    new Paragraph({
      bullet: { level: 0 },
      children: childrenToRuns(children) as any,
    }),
  )
  return out
}

function tableNodeToTable(tableNode: any): Table {
  const rows = (tableNode.children ?? []).filter((r: any) => r.type === 'tr' || r.type === 'table-row')

  const tableRows: TableRow[] = rows.map((row: any) => {
    const cells = (row.children ?? []).filter((c: any) => c.type === 'td' || c.type === 'th' || c.type === 'table-cell' || c.type === 'table-header-cell')

    const tableCells: TableCell[] = cells.map((cell: any) => {
      const isHeader = cell.type === 'th' || cell.type === 'table-header-cell'

      // Cells usually contain paragraphs; render them as Paragraphs
      const cellChildren = cell.children ?? []
      const cellParagraphs: Paragraph[] = []

      for (const n of cellChildren) {
        if (n.type === 'p' || n.type === 'paragraph') {
          cellParagraphs.push(
            new Paragraph({
              children: (childrenToRuns(n.children) as any).map((r: any) => {
                // Bold header text
                if (isHeader && r instanceof TextRun) {
                  return new TextRun({ ...r['options'], bold: true })
                }
                return r
              }),
            }),
          )
        } else {
          // fallback: render inline-ish
          cellParagraphs.push(
            new Paragraph({
              children: childrenToRuns(n.children ?? []) as any,
            }),
          )
        }
      }

      if (!cellParagraphs.length) {
        cellParagraphs.push(new Paragraph({ children: [new TextRun('')] }))
      }

      return new TableCell({
        width: { size: 100, type: WidthType.AUTO },
        children: cellParagraphs,
      })
    })

    return new TableRow({ children: tableCells })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  })
}

export async function exportPlateValueToDocx(value: Value, opts?: { fileName?: string; title?: string }) {
  const fileName = opts?.fileName ?? 'document.docx'

  const blocks: Array<Paragraph | Table> = []
  for (const node of value ?? []) {
    blocks.push(...nodeToBlocks(node))
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, fileName)
}
