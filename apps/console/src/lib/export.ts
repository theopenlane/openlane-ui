type TExportCSV = {
  filename: string
}

interface HttpResponse<T> extends Response {
  message?: T
}

export async function exportCSV<T>(arg: TExportCSV): Promise<void | { message: string }> {
  try {
    const fData: HttpResponse<T> = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arg),
    })

    if (!fData.ok) {
      return { message: 'Failed to fetch CSV' }
    }

    const blob = await fData.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${arg.filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    return { message: 'error' }
  }
}
