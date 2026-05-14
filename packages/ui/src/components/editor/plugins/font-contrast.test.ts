import { adjustForTheme, contrastRatio, mirrorLightnessHsl, parseCssColor, relativeLuminance, rgbToHex, THEME_BACKGROUND_RGB } from './font-contrast'

describe('parseCssColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseCssColor('#ff8040')).toEqual({ r: 255, g: 128, b: 64 })
  })

  it('parses 3-digit hex', () => {
    expect(parseCssColor('#f80')).toEqual({ r: 255, g: 136, b: 0 })
  })

  it('parses 8-digit hex by dropping alpha', () => {
    expect(parseCssColor('#ff804080')).toEqual({ r: 255, g: 128, b: 64 })
  })

  it('parses rgb() with commas', () => {
    expect(parseCssColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 })
  })

  it('parses rgba() and ignores alpha', () => {
    expect(parseCssColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30 })
  })

  it('parses rgb() with whitespace-only separators', () => {
    expect(parseCssColor('rgb(10 20 30)')).toEqual({ r: 10, g: 20, b: 30 })
  })

  it('parses named colors black and white', () => {
    expect(parseCssColor('black')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseCssColor('White')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('returns null for transparent / currentColor / inherit', () => {
    expect(parseCssColor('transparent')).toBeNull()
    expect(parseCssColor('currentColor')).toBeNull()
    expect(parseCssColor('inherit')).toBeNull()
  })

  it('returns null for unknown formats (var, oklch, named non-table)', () => {
    expect(parseCssColor('var(--editor-text-red, #b91c1c)')).toBeNull()
    expect(parseCssColor('oklch(0.5 0.2 30)')).toBeNull()
    expect(parseCssColor('rebeccapurple')).toBeNull()
  })

  it('returns null for malformed hex', () => {
    expect(parseCssColor('#zz')).toBeNull()
    expect(parseCssColor('#12345')).toBeNull()
    expect(parseCssColor('')).toBeNull()
  })

  it('returns null for out-of-range rgb', () => {
    expect(parseCssColor('rgb(10, 20, 300)')).toBeNull()
  })
})

describe('relativeLuminance', () => {
  it('returns 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
  })

  it('returns 1 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black vs white', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('returns 1 for identical colors', () => {
    const grey = { r: 128, g: 128, b: 128 }
    expect(contrastRatio(grey, grey)).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    const a = { r: 50, g: 100, b: 200 }
    const b = { r: 240, g: 240, b: 240 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5)
  })

  it('confirms #ffffff vs light theme bg fails AA-large (<3)', () => {
    expect(contrastRatio({ r: 255, g: 255, b: 255 }, THEME_BACKGROUND_RGB.light)).toBeLessThan(3)
  })

  it('confirms #000000 vs dark theme bg fails AA-large (<3)', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, THEME_BACKGROUND_RGB.dark)).toBeLessThan(3)
  })
})

describe('mirrorLightnessHsl', () => {
  it('flips white to black', () => {
    expect(mirrorLightnessHsl({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('flips black to white', () => {
    expect(mirrorLightnessHsl({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('leaves L=50 colors approximately fixed', () => {
    const pureRed = { r: 255, g: 0, b: 0 }
    const mirrored = mirrorLightnessHsl(pureRed)
    expect(mirrored).toEqual(pureRed)
  })
})

describe('rgbToHex', () => {
  it('pads single-digit channels', () => {
    expect(rgbToHex({ r: 0, g: 1, b: 15 })).toBe('#00010f')
  })

  it('round-trips full-range channels', () => {
    expect(rgbToHex({ r: 255, g: 128, b: 64 })).toBe('#ff8040')
  })
})

describe('adjustForTheme', () => {
  it('returns var(...) values verbatim regardless of theme', () => {
    const v = 'var(--editor-text-red, #b91c1c)'
    expect(adjustForTheme(v, 'light')).toBe(v)
    expect(adjustForTheme(v, 'dark')).toBe(v)
    expect(adjustForTheme(v, undefined)).toBe(v)
  })

  it('returns value verbatim when theme is undefined (serialization path)', () => {
    expect(adjustForTheme('#ffffff', undefined)).toBe('#ffffff')
    expect(adjustForTheme('#000000', undefined)).toBe('#000000')
  })

  it('returns value verbatim when color cannot be parsed', () => {
    expect(adjustForTheme('oklch(0.5 0.2 30)', 'light')).toBe('oklch(0.5 0.2 30)')
    expect(adjustForTheme('transparent', 'dark')).toBe('transparent')
  })

  it('returns value verbatim when contrast already passes threshold', () => {
    // mid-saturation blue passes against light bg
    expect(adjustForTheme('#1d4ed8', 'light')).toBe('#1d4ed8')
    // mid-saturation amber passes against dark bg
    expect(adjustForTheme('#fcd34d', 'dark')).toBe('#fcd34d')
  })

  it('mirrors white to black against light background', () => {
    expect(adjustForTheme('#ffffff', 'light')).toBe('#000000')
  })

  it('mirrors black to white against dark background', () => {
    expect(adjustForTheme('#000000', 'dark')).toBe('#ffffff')
  })

  it('mirrors named white against light background', () => {
    expect(adjustForTheme('white', 'light')).toBe('#000000')
  })

  it('does not touch white when viewer is in dark mode', () => {
    expect(adjustForTheme('#ffffff', 'dark')).toBe('#ffffff')
  })

  it('does not touch black when viewer is in light mode', () => {
    expect(adjustForTheme('#000000', 'light')).toBe('#000000')
  })

  it('handles empty string by returning it verbatim', () => {
    expect(adjustForTheme('', 'light')).toBe('')
  })
})
