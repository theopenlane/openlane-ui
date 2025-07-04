export const fileDownload = async (presignedURL: string, fileName: string, errorNotification: (args: { title: string; variant: 'destructive' | 'default' }) => void) => {
  try {
    const link = document.createElement('a')
    link.href = presignedURL
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    errorNotification({
      title: 'An error occurred while downloading file. Please try again.',
      variant: 'destructive',
    })
  }
}
