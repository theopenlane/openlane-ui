import localFont from 'next/font/local'

const allison = localFont({ src: './Allison-Regular.woff2', weight: '400', preload: false, adjustFontFallback: false, fallback: ['cursive'] })

const greatVibes = localFont({ src: './GreatVibes-Regular.woff2', weight: '400', preload: false, adjustFontFallback: false, fallback: ['cursive'] })

const alexBrush = localFont({ src: './AlexBrush-Regular.woff2', weight: '400', preload: false, adjustFontFallback: false, fallback: ['cursive'] })

export const signatureFontFamilies = [allison, greatVibes, alexBrush].map((font) => font.style.fontFamily)
