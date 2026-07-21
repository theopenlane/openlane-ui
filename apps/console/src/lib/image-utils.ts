const base64SignatureMimeTypes: [string, string][] = [
  ['/9j/', 'image/jpeg'],
  ['R0lGOD', 'image/gif'],
  ['iVBOR', 'image/png'],
  ['UklGR', 'image/webp'],
  ['PHN2', 'image/svg+xml'],
  ['PD94', 'image/svg+xml'],
  ['PCFE', 'image/svg+xml'],
  ['77u/', 'image/svg+xml'],
]

export const toBase64DataUri = (base64: string): string => {
  const match = base64SignatureMimeTypes.find(([signature]) => base64.startsWith(signature))
  return `data:${match?.[1] ?? 'image/png'};base64,${base64}`
}

// Google's public favicon endpoint, used as a lightweight logo lookup for a bare domain
export const logoUrlFromDomain = (domain?: string): string | undefined => {
  if (!domain) return undefined
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}
