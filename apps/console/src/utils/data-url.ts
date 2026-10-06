export const toDataUrl = (base64: string, mimeType: string) => `data:${mimeType};base64,${base64}`

export const getDataUrlByteSize = (dataUrl: string): number => {
  const payloadLength = dataUrl.length - dataUrl.indexOf(',') - 1
  const padding = dataUrl.endsWith('==') ? 2 : dataUrl.endsWith('=') ? 1 : 0
  return Math.floor((payloadLength * 3) / 4) - padding
}
