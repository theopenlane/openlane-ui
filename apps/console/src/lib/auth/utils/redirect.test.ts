import { buildLoginRedirect, sanitizeLoginRedirect } from './redirect'

/**
 * #2193 — the login URL stopped carrying `?redirect=/` when the target is just
 * the root, since that param does nothing.
 *
 * The rest of this module is open-redirect protection, which had no coverage at
 * all. A post-login redirect is attacker-influenceable, so the refusals are the
 * security boundary: anything that is not a same-site absolute path must fall
 * back rather than be followed. `//evil.com` is the classic bypass — it is a
 * protocol-relative URL, not a path, despite starting with a slash.
 */
describe('sanitizeLoginRedirect — accepted targets', () => {
  test('keeps a same-site absolute path', () => {
    expect(sanitizeLoginRedirect('/controls')).toBe('/controls')
  })

  test('preserves query and hash', () => {
    expect(sanitizeLoginRedirect('/controls?tab=evidence#top')).toBe('/controls?tab=evidence#top')
  })

  test('trims surrounding whitespace', () => {
    expect(sanitizeLoginRedirect('  /controls  ')).toBe('/controls')
  })

  test('normalises a traversal that stays on-site', () => {
    expect(sanitizeLoginRedirect('/controls/../policies')).toBe('/policies')
  })
})

describe('sanitizeLoginRedirect — refusals', () => {
  test.each([
    ['an absolute http url', 'http://evil.com/steal'],
    ['an absolute https url', 'https://evil.com/steal'],
    ['a protocol-relative url', '//evil.com'],
    ['a protocol-relative url with a path', '//evil.com/steal'],
    ['a javascript: url', 'javascript:alert(1)'],
    ['a relative path with no leading slash', 'controls'],
    ['an empty string', ''],
    ['whitespace only', '   '],
  ])('falls back for %s', (_label, redirect) => {
    expect(sanitizeLoginRedirect(redirect)).toBe('/')
  })

  test('falls back for null and undefined', () => {
    expect(sanitizeLoginRedirect(null)).toBe('/')
    expect(sanitizeLoginRedirect(undefined)).toBe('/')
  })

  test('refuses to bounce back to the login page itself', () => {
    // Otherwise a successful login lands straight back on the form.
    expect(sanitizeLoginRedirect('/login')).toBe('/')
    expect(sanitizeLoginRedirect('/login/support')).toBe('/')
  })

  test('honours a custom fallback', () => {
    expect(sanitizeLoginRedirect('https://evil.com', '/dashboard')).toBe('/dashboard')
  })
})

describe('buildLoginRedirect', () => {
  test('returns a bare login path when there is no target', () => {
    expect(buildLoginRedirect(null)).toBe('/login')
    expect(buildLoginRedirect(undefined)).toBe('/login')
    expect(buildLoginRedirect('')).toBe('/login')
  })

  test('omits the param when the target is the root', () => {
    // The point of this commit: ?redirect=/ carries no information.
    expect(buildLoginRedirect('/')).toBe('/login')
  })

  test('omits the param when the target sanitises to the fallback', () => {
    expect(buildLoginRedirect('https://evil.com')).toBe('/login')
    expect(buildLoginRedirect('/login')).toBe('/login')
  })

  test('carries a real target as an encoded param', () => {
    expect(buildLoginRedirect('/controls')).toBe(`/login?redirect=${encodeURIComponent('/controls')}`)
  })

  test('encodes query and hash in the param', () => {
    const built = buildLoginRedirect('/controls?tab=evidence#top')

    expect(built).toBe(`/login?redirect=${encodeURIComponent('/controls?tab=evidence#top')}`)
    expect(built).not.toContain('?tab=')
  })

  test('never emits an off-site target in the param', () => {
    for (const hostile of ['//evil.com', 'https://evil.com/steal', 'javascript:alert(1)']) {
      expect(buildLoginRedirect(hostile)).not.toContain('evil.com')
    }
  })
})
