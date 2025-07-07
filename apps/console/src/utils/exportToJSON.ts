export const exportToJSON = <T extends object>(data: T[], columns: { label: string; accessor: (item: T) => string | number | null | undefined }[], fileName: string) => {
  const formattedData = data.map((item) => {
    const row: Record<string, string | number | null> = {}
    columns.forEach((col) => {
      row[col.label] = col.accessor(item) ?? null
    })
    return row
  })

  const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.json`
  a.click()
  URL.revokeObjectURL(url)
}
