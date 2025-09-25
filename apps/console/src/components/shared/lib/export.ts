export const fileDownload = async (presignedURL: string, fileName: string, errorNotification: (args: { title: string; variant: 'destructive' | 'default' }) => void) => {
  try {
    const response = await fetch(presignedURL)
    if (!response.ok) throw new Error('Failed to fetch file')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  } catch {
    errorNotification({
      title: 'An error occurred while downloading file. Please try again.',
      variant: 'destructive',
    })
  }
}
