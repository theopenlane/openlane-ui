import { exportToCSV, type TExportColumn } from './exportToCSV'

type Row = { name: string; note?: string | null; count?: number | null }

const columns: TExportColumn<Row>[] = [
  { label: 'Name', accessor: (row) => row.name },
  { label: 'Note', accessor: (row) => row.note },
]

let lastBlobParts: string[] = []
let lastDownload = ''
let clicks = 0
let revoked: string[] = []

const globals = globalThis as unknown as { Blob?: unknown; URL?: unknown; document?: unknown }
const original = { Blob: globals.Blob, URL: globals.URL, document: globals.document }

class FakeBlob {
  parts: string[]
  constructor(parts: string[]) {
    this.parts = parts
    lastBlobParts = parts
  }
}

globals.Blob = FakeBlob
globals.URL = { createObjectURL: () => 'blob:fake', revokeObjectURL: (url: string) => revoked.push(url) }
globals.document = {
  createElement: () => ({
    set download(value: string) {
      lastDownload = value
    },
    get download() {
      return lastDownload
    },
    href: '',
    click: () => {
      clicks += 1
    },
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
}

afterAll(() => {
  globals.Blob = original.Blob
  globals.URL = original.URL
  globals.document = original.document
})

beforeEach(() => {
  lastBlobParts = []
  lastDownload = ''
  clicks = 0
  revoked = []
})

const csv = (): string => lastBlobParts.slice(1).join('')
const lines = (): string[] => csv().split('\r\n')

describe('exportToCSV — file', () => {
  it('names the file after the caller label', () => {
    exportToCSV([{ name: 'Ada' }], columns, 'members')
    expect(lastDownload).toBe('members.csv')
    expect(clicks).toBe(1)
  })

  it('writes a UTF-8 BOM so spreadsheets read the encoding correctly', () => {
    exportToCSV([{ name: 'Ada' }], columns, 'members')
    expect(lastBlobParts[0]).toBe('﻿')
  })

  it('releases the object url it created, but only after the click', async () => {
    exportToCSV([{ name: 'Ada' }], columns, 'members')
    expect(revoked).not.toContain('blob:fake')
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(revoked).toContain('blob:fake')
  })
})

describe('exportToCSV — rows', () => {
  it('writes the header from the column labels', () => {
    exportToCSV([], columns, 'members')
    expect(lines()[0]).toBe('"Name","Note"')
  })

  it('writes a header even when there are no rows', () => {
    exportToCSV([], columns, 'members')
    expect(lines()).toHaveLength(1)
  })

  it('writes one line per row, separated by CRLF', () => {
    exportToCSV([{ name: 'Ada' }, { name: 'Grace' }], columns, 'members')
    expect(lines()).toHaveLength(3)
    expect(csv()).toContain('\r\n')
  })

  it('renders null and undefined as empty quoted cells', () => {
    exportToCSV([{ name: 'Ada', note: null }], columns, 'members')
    expect(lines()[1]).toBe('"Ada",""')
    exportToCSV([{ name: 'Ada' }], columns, 'members')
    expect(lines()[1]).toBe('"Ada",""')
  })

  it('keeps a zero rather than treating it as empty', () => {
    exportToCSV([{ name: 'Ada', note: '0' }], columns, 'members')
    expect(lines()[1]).toBe('"Ada","0"')
  })
})

describe('exportToCSV — escaping', () => {
  it('doubles embedded quotes', () => {
    exportToCSV([{ name: 'Ada "The Analyst"' }], columns, 'members')
    expect(lines()[1]).toBe('"Ada ""The Analyst""",""')
  })

  it('keeps a comma inside its quoted cell instead of splitting the row', () => {
    exportToCSV([{ name: 'Lovelace, Ada' }], columns, 'members')
    expect(lines()).toHaveLength(2)
    expect(lines()[1]).toBe('"Lovelace, Ada",""')
  })

  it('keeps a newline inside its quoted cell', () => {
    exportToCSV([{ name: 'Ada\nLovelace' }], columns, 'members')
    expect(lines()[1]).toContain('"Ada\nLovelace"')
  })
})

describe('exportToCSV — formula injection', () => {
  it('neutralises a value a spreadsheet would execute', () => {
    for (const trigger of ['=', '+', '-', '@']) {
      exportToCSV([{ name: `${trigger}cmd|calc` }], columns, 'members')
      expect(lines()[1]).toBe(`"'${trigger}cmd|calc",""`)
    }
  })

  it('neutralises a tab or carriage return prefix', () => {
    exportToCSV([{ name: '\tHYPERLINK' }], columns, 'members')
    expect(lines()[1]).toBe('"\'\tHYPERLINK",""')
  })

  it('leaves an ordinary value untouched', () => {
    exportToCSV([{ name: 'Ada Lovelace' }], columns, 'members')
    expect(lines()[1]).toBe('"Ada Lovelace",""')
  })

  it('does not prefix a value that merely contains a trigger later on', () => {
    exportToCSV([{ name: 'a=b' }], columns, 'members')
    expect(lines()[1]).toBe('"a=b",""')
  })

  it('guards the header labels through the same escaping', () => {
    exportToCSV([], [{ label: '=Name', accessor: (row: Row) => row.name }], 'members')
    expect(lines()[0]).toBe(`"'=Name"`)
  })
})
