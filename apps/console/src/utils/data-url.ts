export { getDataUrlByteSize } from '@theopenlane/surveyjs-components'

export const toDataUrl = (base64: string, mimeType: string) => `data:${mimeType};base64,${base64}`
