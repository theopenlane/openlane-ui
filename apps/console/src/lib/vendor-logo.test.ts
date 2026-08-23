import { buildVendorLogoProxyUrl, getVendorLogoUrl, toVendorLogoHost, VENDOR_LOGO_SIZE } from './vendor-logo'

/**
 * ISS-2486 — vendor logos are looked up by domain through an authenticated proxy
 * route. toVendorLogoHost is what decides whether a user-typed website value is
 * safe to forward: it accepts a bare domain or a full URL, strips scheme/path/
 * port down to the hostname, and returns null for anything that is not a real
 * registrable domain — so junk never reaches the outbound favicon request.
 */
describe('toVendorLogoHost', () => {
  test.each([
    ['a bare domain', 'acme.com', 'acme.com'],
    ['a subdomain', 'www.acme.com', 'www.acme.com'],
    ['a full https url', 'https://acme.com', 'acme.com'],
    ['a url with a path', 'https://acme.com/about', 'acme.com'],
    ['a url with a port', 'https://acme.com:8443', 'acme.com'],
    ['mixed case and padding', '  ACME.com  ', 'acme.com'],
    ['a multi-label tld', 'acme.co.uk', 'acme.co.uk'],
  ])('extracts the host from %s', (_label, input, expected) => {
    expect(toVendorLogoHost(input)).toBe(expected)
  })

  test.each([
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['a bare hostname with no dot', 'localhost'],
    ['a trailing-dot domain', 'acme.com.'],
    ['a numeric tld', 'acme.123'],
    ['an ip address', '127.0.0.1'],
  ])('returns null for %s', (_label, input) => {
    expect(toVendorLogoHost(input)).toBeNull()
  })
})

describe('buildVendorLogoProxyUrl', () => {
  test('targets the internal proxy route with the default size', () => {
    expect(buildVendorLogoProxyUrl('acme.com')).toBe(`/api/vendor-logo?domain=acme.com&sz=${VENDOR_LOGO_SIZE.default}`)
  })

  test('honours an explicit size', () => {
    expect(buildVendorLogoProxyUrl('acme.com', 64)).toBe('/api/vendor-logo?domain=acme.com&sz=64')
  })

  test('encodes the domain into the query string', () => {
    expect(buildVendorLogoProxyUrl('acme corp.com')).toContain('domain=acme%20corp.com')
  })

  test('never points at the third-party favicon service directly', () => {
    // The lookup must go through the authenticated proxy, not the browser.
    expect(buildVendorLogoProxyUrl('acme.com')).not.toContain('google.com')
  })
})

describe('getVendorLogoUrl', () => {
  test('returns a data uri for a stored logo', () => {
    const base64 = btoa('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(getVendorLogoUrl({ base64 })).toBe(`data:image/svg+xml;base64,${base64}`)
  })

  test('returns undefined when there is no logo file', () => {
    expect(getVendorLogoUrl(null)).toBeUndefined()
    expect(getVendorLogoUrl(undefined)).toBeUndefined()
    expect(getVendorLogoUrl({ base64: null })).toBeUndefined()
    expect(getVendorLogoUrl({})).toBeUndefined()
  })
})

describe('VENDOR_LOGO_SIZE', () => {
  test('bounds the proxy size range', () => {
    expect(VENDOR_LOGO_SIZE.min).toBeLessThan(VENDOR_LOGO_SIZE.default)
    expect(VENDOR_LOGO_SIZE.default).toBeLessThan(VENDOR_LOGO_SIZE.max)
  })
})
