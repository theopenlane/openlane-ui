import { detectFormat, isSafeLinkHref, SAFE_LINK_PROTOCOLS } from '../file-preview'

describe('detectFormat', () => {
  describe('PDF', () => {
    it('routes by mime type', () => {
      expect(detectFormat('application/pdf', null)).toBe('pdf')
    })

    it('routes by extension when mime is missing', () => {
      expect(detectFormat(null, 'pdf')).toBe('pdf')
    })

    it('strips leading dot from extension', () => {
      expect(detectFormat(null, '.pdf')).toBe('pdf')
    })

    it('is case-insensitive', () => {
      expect(detectFormat('Application/PDF', null)).toBe('pdf')
      expect(detectFormat(null, 'PDF')).toBe('pdf')
    })
  })

  describe('Markdown', () => {
    it.each(['text/markdown', 'text/x-markdown'])('routes mime type %s to markdown', (mime) => {
      expect(detectFormat(mime, null)).toBe('markdown')
    })

    it.each(['md', 'mdx', 'markdown'])('routes extension %s to markdown', (ext) => {
      expect(detectFormat(null, ext)).toBe('markdown')
    })
  })

  describe('HTML', () => {
    it('routes text/html', () => {
      expect(detectFormat('text/html', null)).toBe('html')
    })

    it.each(['html', 'htm'])('routes extension %s', (ext) => {
      expect(detectFormat(null, ext)).toBe('html')
    })
  })

  describe('DOCX', () => {
    it('routes the long openxmlformats mime', () => {
      expect(detectFormat('application/vnd.openxmlformats-officedocument.wordprocessingml.document', null)).toBe('docx')
    })

    it('routes by extension', () => {
      expect(detectFormat(null, 'docx')).toBe('docx')
    })

    it('does NOT route legacy .doc to docx (would mis-render)', () => {
      expect(detectFormat('application/msword', 'doc')).toBe('unsupported')
    })
  })

  describe('Plain text', () => {
    it.each(['text/plain', 'text/plain; charset=utf-8'])('routes mime type %s to text', (mime) => {
      expect(detectFormat(mime, null)).toBe('text')
    })

    it('routes .txt extension', () => {
      expect(detectFormat(null, 'txt')).toBe('text')
    })
  })

  describe('Unsupported', () => {
    it('returns unsupported for unknown mime + extension', () => {
      expect(detectFormat('application/octet-stream', 'xyz')).toBe('unsupported')
    })

    it('returns unsupported for null mime and unknown extension', () => {
      expect(detectFormat(null, 'rtf')).toBe('unsupported')
    })

    it('returns unsupported for both null', () => {
      expect(detectFormat(null, null)).toBe('unsupported')
    })

    it('returns unsupported for empty strings', () => {
      expect(detectFormat('', '')).toBe('unsupported')
    })
  })

  describe('mime takes precedence over extension', () => {
    it('mime wins when both are present and conflict', () => {
      expect(detectFormat('application/pdf', 'docx')).toBe('pdf')
    })
  })
})

describe('isSafeLinkHref', () => {
  const ORIGIN = 'https://app.example.com'

  describe('allowed protocols', () => {
    it.each(['http://example.com', 'https://example.com', 'mailto:user@example.com', 'mailto:user@example.com?subject=hi'])('allows %s', (href) => {
      expect(isSafeLinkHref(href, ORIGIN)).toBe(true)
    })

    it('allows relative URLs (resolved against base origin which is https)', () => {
      expect(isSafeLinkHref('/some/path', ORIGIN)).toBe(true)
    })
  })

  describe('blocked protocols (XSS vectors)', () => {
    it.each([
      'javascript:alert(1)',
      'JavaScript:alert(1)', // case-mixed
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'about:blank',
      'blob:https://example.com/abc',
      'ftp://example.com/file',
    ])('blocks %s', (href) => {
      expect(isSafeLinkHref(href, ORIGIN)).toBe(false)
    })
  })

  describe('malformed input', () => {
    it('blocks completely invalid URLs', () => {
      // The URL constructor should throw on this against an http base, and we
      // treat any throw as unsafe rather than silently allowing the bad input.
      expect(isSafeLinkHref('http://[invalid', ORIGIN)).toBe(false)
    })

    it('treats unknown schemes (rejected via the allowlist) as unsafe', () => {
      // Any scheme not in SAFE_LINK_PROTOCOLS is rejected, regardless of whether
      // the URL parses successfully. This is the allowlist's whole point.
      expect(isSafeLinkHref('chrome-extension://abc/page', ORIGIN)).toBe(false)
    })
  })

  describe('SAFE_LINK_PROTOCOLS allowlist', () => {
    it('is locked down to http/https/mailto only', () => {
      // This test acts as a tripwire: adding a new protocol to the allowlist
      // requires updating this test, forcing reviewers to consider whether the
      // new scheme has XSS implications inside a .docx-rendered anchor.
      expect([...SAFE_LINK_PROTOCOLS].sort()).toEqual(['http:', 'https:', 'mailto:'])
    })
  })
})
