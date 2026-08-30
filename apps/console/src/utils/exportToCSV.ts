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

  const blob = new Blob([UTF8_BOM, csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
