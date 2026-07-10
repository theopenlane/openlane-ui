import { toBase64DataUri } from './image-utils'

describe('toBase64DataUri', () => {
  it('detects svg starting with <svg', () => {
    const base64 = btoa('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(toBase64DataUri(base64)).toBe(`data:image/svg+xml;base64,${base64}`)
  })

  it('detects svg starting with an xml declaration', () => {
    const base64 = btoa('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(toBase64DataUri(base64)).toBe(`data:image/svg+xml;base64,${base64}`)
  })

  it('detects svg starting with a doctype', () => {
    const base64 = btoa('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg></svg>')
    expect(toBase64DataUri(base64)).toBe(`data:image/svg+xml;base64,${base64}`)
  })

  it('detects svg starting with a utf-8 byte order mark', () => {
    const base64 = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('<svg></svg>')]).toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/svg+xml;base64,${base64}`)
  })

  it('detects jpeg', () => {
    const base64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/jpeg;base64,${base64}`)
  })

  it('detects gif', () => {
    const base64 = Buffer.from('GIF89a').toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/gif;base64,${base64}`)
  })

  it('detects png', () => {
    const base64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/png;base64,${base64}`)
  })

  it('detects webp', () => {
    const base64 = Buffer.from('RIFF0000WEBP').toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/webp;base64,${base64}`)
  })

  it('falls back to png for unknown signatures', () => {
    const base64 = Buffer.from('unknown-binary-content').toString('base64')
    expect(toBase64DataUri(base64)).toBe(`data:image/png;base64,${base64}`)
  })
})
