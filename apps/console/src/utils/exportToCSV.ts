// @/lib/utils/export-to-csv.ts

export const exportToCSV = <T extends object>(data: T[], columns: { label: string; accessor: (item: T) => string | number | null | undefined }[], fileName: string) => {
  const csvRows = []

  // Add headers
  csvRows.push(columns.map((col) => col.label).join(','))

  // Add rows
  data.forEach((item) => {
    const row = columns.map((col) => {
      const val = col.accessor(item)
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '')
    })
    csvRows.push(row.join(','))
  })

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
