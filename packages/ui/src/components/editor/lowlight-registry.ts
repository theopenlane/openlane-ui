import { common, createLowlight } from 'lowlight'

export const lowlight = createLowlight(common)

export const isRegisteredLanguage = (language: string) => language === 'auto' || language === 'plaintext' || lowlight.registered(language)
