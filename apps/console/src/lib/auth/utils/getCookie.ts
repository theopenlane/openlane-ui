export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const cookies = document.cookie.split('; ')
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`))
  return found ? found.split('=')[1] : undefined
}
