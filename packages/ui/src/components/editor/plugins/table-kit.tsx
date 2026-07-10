'use client'

import { TableCellHeaderPlugin, TableCellPlugin, TablePlugin, TableRowPlugin } from '@platejs/table/react'
import { getNextTableCell, getTableEntries, insertTableRow } from '@platejs/table'

import { TableCellElement, TableCellHeaderElement, TableElement, TableRowElement } from '@repo/ui/components/ui/table-node.tsx'

const TablePluginWithRowAppend = TablePlugin.overrideEditor(({ editor, tf: { tab } }) => ({
  transforms: {
    tab(options) {
      if (!options?.reverse) {
        const entries = getTableEntries(editor)
        if (entries) {
          const { cell, row } = entries
          const [, cellPath] = cell
          if (!getNextTableCell(editor, cell, cellPath, row)) {
            insertTableRow(editor, { fromRow: row[1], select: true })
            return true
          }
        }
      }
      return tab(options)
    },
  },
}))

export const TableKit = [
  TablePluginWithRowAppend.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
]
