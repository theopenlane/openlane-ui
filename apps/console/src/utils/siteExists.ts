export const siteExists = (url?: string, timeout = 3000): Promise<boolean> => {
  if (!url) return Promise.resolve(false)

  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => {
      img.src = ''
      resolve(false)
    }, timeout)

    img.onload = () => {
      clearTimeout(timer)
      resolve(true)
    }

    img.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }

    img.src = `${url.replace(/\/$/, '')}/favicon.ico?${Date.now()}`
  })
}
