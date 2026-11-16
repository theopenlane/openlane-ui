import { downloadFile } from './downloadFile'

export type TExportColumn<T> = {
  label: string
  accessor: (item: T) => string | number | null | undefined
}

export const FORMULA_TRIGGER = /^[=+\-@\t\r]/
const UTF8_BOM = '\uFEFF'

export const guardCsvFormula = (text: string) => (FORMULA_TRIGGER.test(text) ? `'${text}` : text)

const escapeCsvValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""'

  const guarded = guardCsvFormula(String(value))

  return `"${guarded.replace(/"/g, '""')}"`
}

export const exportToCSV = <T extends object>(data: T[], columns: TExportColumn<T>[], fileName: string) => {
  const csvRows = [columns.map((col) => escapeCsvValue(col.label)).join(',')]

  data.forEach((item) => {
    csvRows.push(columns.map((col) => escapeCsvValue(col.accessor(item))).join(','))
  })

  downloadFile([UTF8_BOM, csvRows.join('\r\n')], `${fileName}.csv`, 'text/csv;charset=utf-8')
}
