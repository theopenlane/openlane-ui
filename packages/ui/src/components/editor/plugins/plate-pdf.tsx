import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any[]

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 11,
    lineHeight: 1.45,
  },
  block: { marginBottom: 10 },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 10 },
  h3: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  h4: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  h5: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  h6: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  p: { fontSize: 11 },
  liRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bullet: { width: 14, textAlign: 'right' },
  table: {
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    flexGrow: 1,
    flexBasis: 0, // so columns distribute evenly by default
  },
  tableLastCell: {
    borderRightWidth: 0,
  },
  tableHeaderText: {
    fontWeight: 700,
  },
})

type Leaf = { text: string; bold?: boolean; italic?: boolean; underline?: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any

function PdfLeaf({ leaf }: { leaf: Leaf }) {
  const style: any = {}
  if (leaf.bold) style.fontWeight = 700
  if (leaf.italic) style.fontStyle = 'italic'
  if (leaf.underline) style.textDecoration = 'underline'
  return <Text style={style}>{leaf.text}</Text>
}

function PdfChildren({ children }: { children: Node[] }) {
  return (
    <>
      {children?.map((child, i) => {
        if (typeof child?.text === 'string') return <PdfLeaf key={i} leaf={child} />
        return <PdfNode key={i} node={child} />
      })}
    </>
  )
}

function PdfNode({ node }: { node: any }) {
  const headingLevel = getHeadingLevel(node)

  if (headingLevel) {
    const style = styles[`h${headingLevel}`]
    return (
      <Text style={style}>
        <PdfChildren children={node.children} />
      </Text>
    )
  }

  switch (node.type) {
    case 'p':
    case 'paragraph':
      return (
        <Text style={[styles.block, styles.p]}>
          <PdfChildren children={node.children} />
        </Text>
      )

    case 'link':
      return (
        <Link src={node.url}>
          <Text>
            <PdfChildren children={node.children} />
          </Text>
        </Link>
      )

    case 'bulleted-list':
      return <View style={styles.block}>{node.children?.map((li: any, idx: number) => <PdfNode key={idx} node={li} />)}</View>

    case 'list-item':
      return (
        <View style={styles.liRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={{ flex: 1 }}>
            <PdfChildren children={node.children} />
          </Text>
        </View>
      )
    case 'table': {
      // Expect children = rows
      const rows = node.children ?? []
      return (
        <View style={styles.table}>
          {rows.map((row: any, rIdx: number) => (
            <PdfNode key={rIdx} node={row} />
          ))}
        </View>
      )
    }

    case 'tr':
    case 'table-row': {
      const cells = node.children ?? []
      return (
        <View style={styles.tableRow}>
          {cells.map((cell: any, cIdx: number) => (
            <PdfNode
              key={cIdx}
              node={{
                ...cell,
                __isLastCell: cIdx === cells.length - 1,
              }}
            />
          ))}
        </View>
      )
    }

    case 'th':
    case 'table-header-cell':
    case 'td':
    case 'table-cell': {
      const isHeader = node.type === 'th' || node.type === 'table-header-cell'

      const cellStyle = node.__isLastCell ? [styles.tableCell, styles.tableLastCell] : [styles.tableCell]

      return (
        <View style={cellStyle}>
          {isHeader ? (
            <Text style={styles.tableHeaderText}>
              <PdfCellContent node={node} />
            </Text>
          ) : (
            <PdfCellContent node={node} />
          )}
        </View>
      )
    }
    default:
      // fallback: just render children
      if (node.children) {
        return (
          <Text style={styles.block}>
            <PdfChildren children={node.children} />
          </Text>
        )
      }
      return null
  }
}

export function PlatePdfDocument({ value, title }: { value: Value; title?: string }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {title && <Text style={styles.h1}>{title}</Text>}
        {value.map((node, i) => (
          <PdfNode key={i} node={node} />
        ))}
      </Page>
    </Document>
  )
}

function PdfCellContent({ node }: { node: any }) {
  const children = node.children ?? []
  return (
    <Text>
      {children.map((child: any, i: number) => {
        // If paragraph, render its children directly
        if (child.type === 'p' || child.type === 'paragraph') {
          return (
            <React.Fragment key={i}>
              <PdfChildren children={child.children} />
              {/* newline between paragraphs inside a cell */}
              {i < children.length - 1 ? '\n' : ''}
            </React.Fragment>
          )
        }

        // Fallback: render whatever it is
        return (
          <React.Fragment key={i}>
            {/* PdfNode might return <Text> or <View>; for safety keep it inline-ish */} <PdfChildren children={child.children ?? []} />
          </React.Fragment>
        )
      })}
    </Text>
  )
}

function getHeadingLevel(node: any): 1 | 2 | 3 | 4 | 5 | 6 | null {
  if (!node?.type) return null

  // h1, h2, ...
  if (/^h[1-6]$/.test(node.type)) {
    return Number(node.type[1]) as any
  }

  // heading-one, heading-two, ...
  const map: Record<string, number> = {
    'heading-one': 1,
    'heading-two': 2,
    'heading-three': 3,
    'heading-four': 4,
    'heading-five': 5,
    'heading-six': 6,
  }
  if (map[node.type]) return map[node.type] as any

  // heading with level
  if (node.type === 'heading' && typeof node.level === 'number') {
    return Math.min(Math.max(node.level, 1), 6) as any
  }

  return null
}
