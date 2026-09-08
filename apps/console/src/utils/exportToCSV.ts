import { downloadFile } from './downloadFile'

export type TExportColumn<T> = {
  label: string
  accessor: (item: T) => string | number | null | undefined
}

const FORMULA_TRIGGER = /^[=+\-@\t\r]/
const UTF8_BOM = '\uFEFF'

const escapeCsvValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""'

  const text = String(value)
  const guarded = FORMULA_TRIGGER.test(text) ? `'${text}` : text

  return `"${guarded.replace(/"/g, '""')}"`
}

export const exportToCSV = <T extends object>(data: T[], columns: TExportColumn<T>[], fileName: string) => {
  const csvRows = [columns.map((col) => escapeCsvValue(col.label)).join(',')]

  data.forEach((item) => {
    csvRows.push(columns.map((col) => escapeCsvValue(col.accessor(item))).join(','))
  })

  downloadFile([UTF8_BOM, csvRows.join('\r\n')], `${fileName}.csv`, 'text/csv;charset=utf-8')
}
