export const toBase64DataUri = (base64: string): string => {
  if (base64.startsWith('data:')) return base64
  if (base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`
  if (base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`
  if (base64.startsWith('UklGR')) return `data:image/webp;base64,${base64}`
  return `data:image/png;base64,${base64}`
}
