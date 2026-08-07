import { common, createLowlight } from 'lowlight'

export const lowlight = createLowlight(common)

export const registeredLanguages = new Set(['auto', 'plaintext', ...lowlight.listLanguages()])
